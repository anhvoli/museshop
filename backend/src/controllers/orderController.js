import { getDb, getNextSequence } from '../config/db.js';

export const checkout = async (req, res) => {
  try {
    const { plan_id, quantity = 1 } = req.body;
    const userId = req.user.id;
    const db = getDb();

    if (!plan_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn gói sản phẩm' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Số lượng mua không hợp lệ' });
    }

    // 1. Lấy thông tin plan & product
    const plan = await db.collection('product_plans').findOne({ id: Number(plan_id), status: 1 });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Gói sản phẩm không tồn tại hoặc đã ngừng kinh doanh' });
    }

    const product = await db.collection('products').findOne({ id: plan.product_id, status: 1 });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm tương ứng không khả dụng' });
    }

    const unitPrice = parseFloat(plan.sale_price > 0 ? plan.sale_price : plan.price);
    const totalPrice = unitPrice * qty;

    // 2. Kiểm tra tồn kho
    const stocks = await db.collection('product_stock')
      .find({ plan_id: plan.id, status: 1 })
      .limit(qty)
      .toArray();

    if (stocks.length < qty) {
      return res.status(400).json({
        success: false,
        message: `Số lượng trong kho không đủ (Hiện còn ${stocks.length} gói)`
      });
    }

    // 3. Kiểm tra số dư người dùng
    const user = await db.collection('users').findOne({ id: Number(userId) });
    const currentBalance = parseFloat(user?.money || 0);

    if (currentBalance < totalPrice) {
      return res.status(400).json({
        success: false,
        message: `Số dư ví không đủ! Cần ${totalPrice.toLocaleString('vi-VN')}đ nhưng ví của bạn chỉ có ${currentBalance.toLocaleString('vi-VN')}đ. Vui lòng nạp thêm tiền.`,
        required: totalPrice,
        current: currentBalance
      });
    }

    // 4. Trừ tiền tài khoản
    await db.collection('users').updateOne(
      { id: Number(userId) },
      {
        $inc: { money: -totalPrice },
        $set: { update_date: new Date() }
      }
    );

    // 5. Tạo mã giao dịch & nội dung bàn giao
    const transId = 'SK' + Date.now() + Math.floor(Math.random() * 1000);
    const deliveryContent = stocks.map(s => s.stock_value).join('\n');
    const orderId = await getNextSequence('product_orders');

    // 6. Lưu đơn hàng
    const newOrder = {
      id: orderId,
      trans_id: transId,
      user_id: Number(userId),
      product_id: product.id,
      plan_id: plan.id,
      product_name: product.name,
      plan_name: plan.name,
      total_price: totalPrice,
      final_amount: totalPrice,
      sale_price: unitPrice,
      cost_price: parseFloat(plan.cost_price || 0),
      status: 'completed',
      payment_status: 'paid',
      order_source: 'web',
      quantity: qty,
      delivery_content: deliveryContent,
      created_at: new Date(),
      updated_at: new Date(),
      completed_at: new Date()
    };

    await db.collection('product_orders').insertOne(newOrder);

    // 7. Cập nhật các kho đã xuất
    const stockIds = stocks.map(s => s._id);
    await db.collection('product_stock').updateMany(
      { _id: { $in: stockIds } },
      {
        $set: {
          status: 0,
          order_id: orderId,
          buyer_id: Number(userId),
          updated_at: new Date()
        }
      }
    );

    // 8. Tăng số lượng đã bán
    await db.collection('products').updateOne(
      { id: product.id },
      { $inc: { sold: qty } }
    );
    await db.collection('product_plans').updateOne(
      { id: plan.id },
      { $inc: { sold: qty } }
    );

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công! Đã tự động xuất tài khoản/key.',
      order: {
        id: orderId,
        trans_id: transId,
        product_name: product.name,
        plan_name: plan.name,
        quantity: qty,
        total_price: totalPrice,
        delivery_content: deliveryContent,
        created_at: newOrder.created_at
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xử lý đặt hàng: ' + error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { page = 1, limit = 20 } = req.query;
    const db = getDb();

    const pNum = Math.max(1, Number(page) || 1);
    const pLimit = Math.max(1, Number(limit) || 20);
    const offset = (pNum - 1) * pLimit;

    const orders = await db.collection('product_orders')
      .find({ user_id: userId })
      .sort({ id: -1 })
      .skip(offset)
      .limit(pLimit)
      .toArray();

    // Lấy ảnh và slug của sản phẩm
    const productIds = orders.map(o => o.product_id).filter(Boolean);
    const products = await db.collection('products')
      .find({ id: { $in: productIds } })
      .project({ id: 1, image: 1, slug: 1 })
      .toArray();

    const prodMap = {};
    products.forEach(p => { prodMap[p.id] = p; });

    const formatted = orders.map(o => ({
      id: o.id,
      trans_id: o.trans_id,
      product_name: o.product_name,
      plan_name: o.plan_name,
      quantity: o.quantity,
      total_price: parseFloat(o.total_price || 0),
      status: o.status,
      payment_status: o.payment_status,
      delivery_content: o.delivery_content,
      created_at: o.created_at,
      image: prodMap[o.product_id]?.image || '',
      slug: prodMap[o.product_id]?.slug || ''
    }));

    return res.json({
      success: true,
      orders: formatted
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử đơn hàng' });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const { transId } = req.params;
    const userId = Number(req.user.id);
    const isAdmin = Number(req.user.admin) >= 1;
    const db = getDb();

    const query = { trans_id: transId };
    if (!isAdmin) {
      query.user_id = userId;
    }

    const order = await db.collection('product_orders').findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Lấy thông tin sản phẩm
    const product = await db.collection('products').findOne({ id: order.product_id });

    return res.json({
      success: true,
      order: {
        ...order,
        total_price: parseFloat(order.total_price || 0),
        image: product?.image || '',
        slug: product?.slug || ''
      }
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết đơn hàng' });
  }
};
