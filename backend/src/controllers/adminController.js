import { getDb, getNextSequence } from '../config/db.js';

// ==========================================
// 1. DASHBOARD & STATS
// ==========================================
export const getStats = async (req, res) => {
  try {
    const db = getDb();

    // Doanh thu tổng từ các đơn paid
    const revAgg = await db.collection('product_orders').aggregate([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$final_amount' } } }
    ]).toArray();
    const totalRevenue = revAgg[0]?.total || 0;

    const totalOrders = await db.collection('product_orders').countDocuments();
    const totalUsers = await db.collection('users').countDocuments();
    const totalProducts = await db.collection('products').countDocuments({ status: 1 });
    const totalStock = await db.collection('product_stock').countDocuments({ status: 1 });

    // Doanh thu & đơn hàng hôm nay
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRevAgg = await db.collection('product_orders').aggregate([
      { $match: { payment_status: 'paid', created_at: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$final_amount' } } }
    ]).toArray();
    const revenueToday = todayRevAgg[0]?.total || 0;

    const ordersToday = await db.collection('product_orders').countDocuments({
      created_at: { $gte: startOfToday }
    });

    // Biểu đồ 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentPaidOrders = await db.collection('product_orders').find({
      payment_status: 'paid',
      created_at: { $gte: sevenDaysAgo }
    }).toArray();

    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      chartMap[dayStr] = { date: dayStr, revenue: 0, orders: 0 };
    }

    recentPaidOrders.forEach(o => {
      const d = new Date(o.created_at);
      const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (chartMap[dayStr]) {
        chartMap[dayStr].revenue += parseFloat(o.final_amount || 0);
        chartMap[dayStr].orders += 1;
      }
    });

    const chartData = Object.values(chartMap);

    // 10 đơn hàng gần nhất
    const recentOrdersRaw = await db.collection('product_orders')
      .find()
      .sort({ id: -1 })
      .limit(10)
      .toArray();

    const userIds = recentOrdersRaw.map(o => o.user_id).filter(Boolean);
    const users = await db.collection('users').find({ id: { $in: userIds } }).toArray();
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.username; });

    const recentOrders = recentOrdersRaw.map(o => ({
      id: o.id,
      trans_id: o.trans_id,
      product_name: o.product_name,
      plan_name: o.plan_name,
      final_amount: parseFloat(o.final_amount || 0),
      status: o.status,
      created_at: o.created_at,
      username: userMap[o.user_id] || 'Khách'
    }));

    return res.json({
      success: true,
      stats: {
        totalRevenue: parseFloat(totalRevenue || 0),
        revenueToday: parseFloat(revenueToday || 0),
        totalOrders,
        ordersToday,
        totalUsers,
        totalProducts,
        totalStock
      },
      chartData,
      recentOrders
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy thống kê quản trị' });
  }
};

// ==========================================
// 2. CATEGORIES MANAGEMENT
// ==========================================
export const getAdminCategories = async (req, res) => {
  try {
    const db = getDb();
    const categories = await db.collection('categories')
      .find()
      .sort({ stt: 1, id: -1 })
      .toArray();

    const allProducts = await db.collection('products').find().toArray();

    const formatted = categories.map(c => {
      const count = allProducts.filter(p => {
        const catIds = String(p.category_ids || '').split(',').map(s => s.trim());
        return catIds.includes(String(c.id));
      }).length;

      return {
        ...c,
        products_count: count
      };
    });

    return res.json({ success: true, categories: formatted });
  } catch (error) {
    console.error('Admin get categories error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh mục' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, icon, description, status = 'show', stt = 0 } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục' });
    }

    const db = getDb();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newId = await getNextSequence('categories');

    const newCategory = {
      id: newId,
      name,
      slug: finalSlug,
      icon: icon || '',
      description: description || '',
      status,
      stt: Number(stt) || 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('categories').insertOne(newCategory);

    return res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công!',
      categoryId: newId
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi tạo danh mục: ' + error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, description, status, stt } = req.body;
    const db = getDb();

    await db.collection('categories').updateOne(
      { id: Number(id) },
      {
        $set: {
          name,
          slug,
          icon: icon || '',
          description: description || '',
          status,
          stt: Number(stt) || 0,
          updated_at: new Date()
        }
      }
    );

    return res.json({ success: true, message: 'Cập nhật danh mục thành công!' });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật danh mục' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.collection('categories').deleteOne({ id: Number(id) });
    return res.json({ success: true, message: 'Đã xóa danh mục!' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa danh mục' });
  }
};

// ==========================================
// 3. PRODUCTS & PLANS MANAGEMENT
// ==========================================
export const getAdminProducts = async (req, res) => {
  try {
    const db = getDb();
    const products = await db.collection('products').find().sort({ id: -1 }).toArray();

    const allPlans = await db.collection('product_plans').find().toArray();
    const availableStocks = await db.collection('product_stock').find({ status: 1 }).toArray();

    const planStockMap = {};
    availableStocks.forEach(s => {
      planStockMap[s.plan_id] = (planStockMap[s.plan_id] || 0) + 1;
    });

    const formatted = products.map(p => {
      const plans = allPlans.filter(pl => pl.product_id === p.id);
      let totalStock = 0;
      plans.forEach(pl => {
        totalStock += planStockMap[pl.id] || 0;
      });

      return {
        ...p,
        plans_count: plans.length,
        in_stock: totalStock
      };
    });

    return res.json({ success: true, products: formatted });
  } catch (error) {
    console.error('Admin get products error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách sản phẩm' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, slug, category_ids, description, image, status = 1, sort_order = 0 } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên sản phẩm' });
    }

    const db = getDb();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
    const newId = await getNextSequence('products');

    const catStr = Array.isArray(category_ids) ? category_ids.join(',') : (category_ids || '');

    const newProd = {
      id: newId,
      name,
      slug: finalSlug,
      category_ids: catStr,
      description: description || '',
      image: image || '',
      status: status ? 1 : 0,
      sort_order: Number(sort_order) || 0,
      sold: 0,
      rating: 5,
      rating_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('products').insertOne(newProd);

    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công!',
      productId: newId
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi tạo sản phẩm: ' + error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, category_ids, description, image, status, sort_order } = req.body;
    const db = getDb();

    const catStr = Array.isArray(category_ids) ? category_ids.join(',') : (category_ids || '');

    await db.collection('products').updateOne(
      { id: Number(id) },
      {
        $set: {
          name,
          slug,
          category_ids: catStr,
          description: description || '',
          image: image || '',
          status: status ? 1 : 0,
          sort_order: Number(sort_order) || 0,
          updated_at: new Date()
        }
      }
    );

    return res.json({ success: true, message: 'Cập nhật sản phẩm thành công!' });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật sản phẩm' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);
    const db = getDb();

    // Tìm các gói cước
    const plans = await db.collection('product_plans').find({ product_id: numId }).toArray();
    const planIds = plans.map(p => p.id);

    // Xóa kho của các gói
    if (planIds.length > 0) {
      await db.collection('product_stock').deleteMany({ plan_id: { $in: planIds } });
    }
    // Xóa gói
    await db.collection('product_plans').deleteMany({ product_id: numId });
    // Xóa sản phẩm
    await db.collection('products').deleteOne({ id: numId });

    return res.json({ success: true, message: 'Đã xóa sản phẩm và toàn bộ gói cước liên quan!' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm' });
  }
};

// Plans for a specific product
export const getProductPlans = async (req, res) => {
  try {
    const { productId } = req.params;
    const db = getDb();
    const plans = await db.collection('product_plans')
      .find({ product_id: Number(productId) })
      .sort({ sort_order: 1, id: 1 })
      .toArray();

    const planIds = plans.map(p => p.id);
    const stocks = await db.collection('product_stock')
      .find({ plan_id: { $in: planIds } })
      .toArray();

    const formatted = plans.map(p => {
      const inStock = stocks.filter(s => s.plan_id === p.id && s.status === 1).length;
      const soldCount = stocks.filter(s => s.plan_id === p.id && s.status === 0).length;

      return {
        ...p,
        cost_price: parseFloat(p.cost_price || 0),
        price: parseFloat(p.price || 0),
        sale_price: parseFloat(p.sale_price || 0),
        in_stock: inStock,
        sold_count: soldCount
      };
    });

    return res.json({ success: true, plans: formatted });
  } catch (error) {
    console.error('Get product plans error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách gói' });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { product_id, name, duration_type = 'month', duration_value = 1, cost_price = 0, price, sale_price = 0, sort_order = 0, status = 1 } = req.body;

    if (!product_id || !name || !price) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên gói và giá bán' });
    }

    const db = getDb();
    const newId = await getNextSequence('product_plans');

    const newPlan = {
      id: newId,
      product_id: Number(product_id),
      name,
      duration_type,
      duration_value: Number(duration_value) || 1,
      cost_price: Number(cost_price) || 0,
      price: Number(price),
      sale_price: Number(sale_price) || 0,
      sort_order: Number(sort_order) || 0,
      status: status ? 1 : 0,
      sold: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('product_plans').insertOne(newPlan);

    return res.status(201).json({
      success: true,
      message: 'Thêm gói cước thành công!',
      planId: newId
    });
  } catch (error) {
    console.error('Create plan error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi thêm gói: ' + error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration_type, duration_value, cost_price, price, sale_price, sort_order, status } = req.body;
    const db = getDb();

    await db.collection('product_plans').updateOne(
      { id: Number(id) },
      {
        $set: {
          name,
          duration_type,
          duration_value: Number(duration_value) || 1,
          cost_price: Number(cost_price) || 0,
          price: Number(price),
          sale_price: Number(sale_price) || 0,
          sort_order: Number(sort_order) || 0,
          status: status ? 1 : 0,
          updated_at: new Date()
        }
      }
    );

    return res.json({ success: true, message: 'Cập nhật gói cước thành công!' });
  } catch (error) {
    console.error('Update plan error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật gói' });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);
    const db = getDb();

    await db.collection('product_stock').deleteMany({ plan_id: numId });
    await db.collection('product_plans').deleteOne({ id: numId });

    return res.json({ success: true, message: 'Đã xóa gói và các key thuộc gói!' });
  } catch (error) {
    console.error('Delete plan error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa gói' });
  }
};

// ==========================================
// 4. STOCK & INVENTORY MANAGEMENT
// ==========================================
export const getStockPlans = async (req, res) => {
  try {
    const db = getDb();
    const plans = await db.collection('product_plans').find().toArray();
    const products = await db.collection('products').find().toArray();
    const stocks = await db.collection('product_stock').find().toArray();

    const prodMap = {};
    products.forEach(p => { prodMap[p.id] = p; });

    const formatted = plans.map(pl => {
      const prod = prodMap[pl.product_id];
      const available = stocks.filter(s => s.plan_id === pl.id && s.status === 1).length;
      const sold = stocks.filter(s => s.plan_id === pl.id && s.status === 0).length;

      return {
        id: pl.id,
        plan_name: pl.name,
        price: parseFloat(pl.price || 0),
        sale_price: parseFloat(pl.sale_price || 0),
        product_id: pl.product_id,
        product_name: prod?.name || 'Sản phẩm đã xóa',
        image: prod?.image || '',
        available_stock: available,
        sold_stock: sold
      };
    });

    formatted.sort((a, b) => a.product_name.localeCompare(b.product_name) || a.price - b.price);

    return res.json({ success: true, plans: formatted });
  } catch (error) {
    console.error('Get stock plans error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách kho' });
  }
};

export const getPlanKeys = async (req, res) => {
  try {
    const { planId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;
    const db = getDb();

    const filter = { plan_id: Number(planId) };
    if (status !== undefined && status !== '') {
      filter.status = Number(status);
    }

    const pNum = Math.max(1, Number(page) || 1);
    const pLimit = Math.max(1, Number(limit) || 50);
    const offset = (pNum - 1) * pLimit;

    const keys = await db.collection('product_stock')
      .find(filter)
      .sort({ id: -1 })
      .skip(offset)
      .limit(pLimit)
      .toArray();

    const total = await db.collection('product_stock').countDocuments({ plan_id: Number(planId) });

    return res.json({
      success: true,
      keys,
      total
    });
  } catch (error) {
    console.error('Get plan keys error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách key' });
  }
};

export const deleteStockKey = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.collection('product_stock').deleteOne({ id: Number(id) });
    return res.json({ success: true, message: 'Đã xóa key thành công!' });
  } catch (error) {
    console.error('Delete stock key error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa key' });
  }
};

export const importStock = async (req, res) => {
  try {
    const { plan_id, raw_keys } = req.body;
    if (!plan_id || !raw_keys) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn gói và nhập danh sách key' });
    }

    const keys = raw_keys
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy key hợp lệ để nhập' });
    }

    const db = getDb();
    const docs = [];
    for (const k of keys) {
      const nextId = await getNextSequence('product_stock');
      docs.push({
        id: nextId,
        plan_id: Number(plan_id),
        stock_value: k,
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await db.collection('product_stock').insertMany(docs);

    return res.json({
      success: true,
      message: `Đã nhập thành công ${keys.length} key vào kho!`
    });
  } catch (error) {
    console.error('Import stock error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi nhập kho: ' + error.message });
  }
};

// ==========================================
// 5. ORDERS MANAGEMENT
// ==========================================
export const getAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    const db = getDb();

    const filter = {};
    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { trans_id: { $regex: q, $options: 'i' } },
        { product_name: { $regex: q, $options: 'i' } }
      ];
    }

    const pNum = Math.max(1, Number(page) || 1);
    const pLimit = Math.max(1, Number(limit) || 50);
    const offset = (pNum - 1) * pLimit;

    const orders = await db.collection('product_orders')
      .find(filter)
      .sort({ id: -1 })
      .skip(offset)
      .limit(pLimit)
      .toArray();

    const userIds = orders.map(o => o.user_id).filter(Boolean);
    const users = await db.collection('users').find({ id: { $in: userIds } }).toArray();
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const formatted = orders.map(o => {
      const user = userMap[o.user_id];
      return {
        ...o,
        total_price: parseFloat(o.total_price || 0),
        final_amount: parseFloat(o.final_amount || 0),
        username: user?.username || 'Khách',
        email: user?.email || ''
      };
    });

    return res.json({
      success: true,
      orders: formatted
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, refund = false } = req.body;
    const db = getDb();

    const order = await db.collection('product_orders').findOne({ id: Number(id) });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Hoàn tiền nếu được yêu cầu
    if (refund && order.payment_status === 'paid' && order.status !== 'cancelled') {
      await db.collection('users').updateOne(
        { id: Number(order.user_id) },
        { $inc: { money: parseFloat(order.final_amount || 0) } }
      );
      await db.collection('product_orders').updateOne(
        { id: Number(id) },
        {
          $set: {
            status: 'cancelled',
            payment_status: 'refunded',
            updated_at: new Date()
          }
        }
      );
    } else {
      await db.collection('product_orders').updateOne(
        { id: Number(id) },
        {
          $set: {
            status,
            updated_at: new Date()
          }
        }
      );
    }

    return res.json({ success: true, message: 'Đã cập nhật trạng thái đơn hàng thành công!' });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật đơn hàng' });
  }
};

// ==========================================
// 6. USERS MANAGEMENT
// ==========================================
export const getAdminUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const db = getDb();

    const filter = {};
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const pNum = Math.max(1, Number(page) || 1);
    const pLimit = Math.max(1, Number(limit) || 50);
    const offset = (pNum - 1) * pLimit;

    const users = await db.collection('users')
      .find(filter)
      .sort({ id: -1 })
      .skip(offset)
      .limit(pLimit)
      .toArray();

    return res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullname: u.fullname || u.username,
        money: parseFloat(u.money || 0),
        total_money: parseFloat(u.total_money || 0),
        admin: Number(u.admin) || 0,
        banned: Number(u.banned) || 0,
        reason_banned: u.reason_banned || '',
        create_date: u.create_date
      }))
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách thành viên' });
  }
};

export const adjustUserBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const db = getDb();

    const diff = parseFloat(amount);
    if (isNaN(diff) || diff === 0) {
      return res.status(400).json({ success: false, message: 'Số tiền điều chỉnh không hợp lệ' });
    }

    const user = await db.collection('users').findOne({ id: Number(id) });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const currentMoney = parseFloat(user.money || 0);
    const newMoney = Math.max(0, currentMoney + diff);
    const incTotal = diff > 0 ? diff : 0;

    await db.collection('users').updateOne(
      { id: Number(id) },
      {
        $set: { money: newMoney },
        $inc: { total_money: incTotal }
      }
    );

    // Ghi log dòng tiền
    await db.collection('dongtien').insertOne({
      user_id: Number(id),
      sotientruoc: currentMoney,
      sotienthaydoi: diff,
      sotiensau: newMoney,
      thoigian: new Date(),
      noidung: reason || 'Admin điều chỉnh số dư',
      created_at: new Date()
    });

    return res.json({
      success: true,
      message: `Đã ${diff > 0 ? 'cộng' : 'trừ'} ${Math.abs(diff).toLocaleString('vi-VN')} đ cho thành viên. Số dư mới: ${newMoney.toLocaleString('vi-VN')} đ.`,
      newBalance: newMoney
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi điều chỉnh số dư' });
  }
};

export const toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { banned, reason = '' } = req.body;
    const db = getDb();

    await db.collection('users').updateOne(
      { id: Number(id) },
      {
        $set: {
          banned: banned ? 1 : 0,
          reason_banned: reason
        }
      }
    );

    return res.json({
      success: true,
      message: banned ? 'Đã khóa tài khoản thành viên!' : 'Đã mở khóa tài khoản thành viên!'
    });
  } catch (error) {
    console.error('Toggle ban error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khóa/mở khóa tài khoản' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin } = req.body;
    const db = getDb();

    await db.collection('users').updateOne(
      { id: Number(id) },
      { $set: { admin: Number(admin) || 0 } }
    );

    return res.json({ success: true, message: 'Cập nhật quyền thành viên thành công!' });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật quyền' });
  }
};

// ==========================================
// 7. COUPONS MANAGEMENT
// ==========================================
export const getAdminCoupons = async (req, res) => {
  try {
    const db = getDb();
    const coupons = await db.collection('coupons').find().sort({ id: -1 }).toArray();

    return res.json({
      success: true,
      coupons: coupons.map(c => ({
        ...c,
        value: parseFloat(c.value || 0),
        min_order_amount: parseFloat(c.min_order_amount || 0),
        max_discount_amount: parseFloat(c.max_discount_amount || 0)
      }))
    });
  } catch (error) {
    console.error('Get admin coupons error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải mã giảm giá' });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, type = 'percentage', value, min_order_amount = 0, max_discount_amount = 0, usage_limit = 100, status = 1 } = req.body;

    if (!code || !value) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã và giá trị giảm' });
    }

    const db = getDb();
    const newId = await getNextSequence('coupons');

    const newCoupon = {
      id: newId,
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      min_order_amount: Number(min_order_amount) || 0,
      max_discount_amount: Number(max_discount_amount) || 0,
      usage_limit: Number(usage_limit) || 0,
      used_count: 0,
      status: status ? 1 : 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('coupons').insertOne(newCoupon);

    return res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công!' });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tạo mã giảm giá: ' + error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.collection('coupons').deleteOne({ id: Number(id) });
    return res.json({ success: true, message: 'Đã xóa mã giảm giá!' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa mã' });
  }
};

// ==========================================
// 8. SETTINGS & BANKS MANAGEMENT
// ==========================================
export const getAllSettings = async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.collection('settings').find().toArray();
    const settings = {};
    rows.forEach(r => {
      settings[r.name] = r.value;
    });

    const banks = await db.collection('banks').find().sort({ id: 1 }).toArray();

    return res.json({ success: true, settings, banks });
  } catch (error) {
    console.error('Get all settings error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải cài đặt' });
  }
};

export const saveSettings = async (req, res) => {
  try {
    const entries = req.body;
    const db = getDb();

    for (const [key, val] of Object.entries(entries)) {
      await db.collection('settings').updateOne(
        { name: key },
        { $set: { name: key, value: String(val) } },
        { upsert: true }
      );
    }

    return res.json({ success: true, message: 'Lưu cài đặt thành công!' });
  } catch (error) {
    console.error('Save settings error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi lưu cài đặt' });
  }
};

export const addBank = async (req, res) => {
  try {
    const { short_name, accountName, accountNumber, image } = req.body;
    if (!short_name || !accountNumber || !accountName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin ngân hàng' });
    }

    const db = getDb();
    const newId = await getNextSequence('banks');

    const newBank = {
      id: newId,
      short_name,
      accountName: accountName.toUpperCase(),
      accountNumber,
      image: image || 'https://api.vietqr.io/img/MB.png',
      status: 1,
      created_at: new Date()
    };

    await db.collection('banks').insertOne(newBank);

    return res.status(201).json({ success: true, message: 'Thêm tài khoản ngân hàng thành công!' });
  } catch (error) {
    console.error('Add bank error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi thêm ngân hàng' });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.collection('banks').deleteOne({ id: Number(id) });
    return res.json({ success: true, message: 'Đã xóa ngân hàng!' });
  } catch (error) {
    console.error('Delete bank error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xóa ngân hàng' });
  }
};
