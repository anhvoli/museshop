import { getDb } from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const { category_id, search, sort = 'popular', page = 1, limit = 20 } = req.query;
    const db = getDb();

    const filter = { status: 1 };

    if (category_id) {
      filter.category_ids = { $regex: new RegExp(`(^|,)${category_id}(,|$)`) };
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Lấy tất cả sản phẩm khớp bộ lọc
    const rawProducts = await db.collection('products').find(filter).toArray();

    // Lấy tất cả plans và stocks tương ứng
    const productIds = rawProducts.map(p => p.id);
    const allPlans = await db.collection('product_plans')
      .find({ product_id: { $in: productIds }, status: 1 })
      .toArray();

    const planIds = allPlans.map(p => p.id);
    const availableStocks = await db.collection('product_stock')
      .find({ plan_id: { $in: planIds }, status: 1 })
      .toArray();

    // Gom stock theo planId
    const stockMap = {};
    availableStocks.forEach(s => {
      stockMap[s.plan_id] = (stockMap[s.plan_id] || 0) + 1;
    });

    // Gom plan theo productId
    const planMap = {};
    allPlans.forEach(p => {
      if (!planMap[p.product_id]) planMap[p.product_id] = [];
      planMap[p.product_id].push({
        ...p,
        stockCount: stockMap[p.id] || 0
      });
    });

    // Tính toán giá và kho cho từng sản phẩm
    let formatted = rawProducts.map(p => {
      const plans = planMap[p.id] || [];
      let min_price = null;
      let min_sale_price = null;
      let max_price = null;
      let total_stock = 0;

      plans.forEach(pl => {
        const pr = parseFloat(pl.price || 0);
        const sl = parseFloat(pl.sale_price || 0);
        if (min_price === null || pr < min_price) min_price = pr;
        if (max_price === null || pr > max_price) max_price = pr;
        if (sl > 0 && (min_sale_price === null || sl < min_sale_price)) {
          min_sale_price = sl;
        }
        total_stock += pl.stockCount || 0;
      });

      const display_price = min_sale_price || min_price || 0;
      const original_price = min_sale_price && min_price ? min_price : null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description || '',
        image: p.image || '',
        category_ids: p.category_ids || '',
        rating: parseFloat(p.rating || 5),
        rating_count: Number(p.rating_count || 0),
        sold: Number(p.sold || 0),
        min_price: min_price || 0,
        min_sale_price: min_sale_price || 0,
        max_price: max_price || 0,
        display_price,
        original_price,
        plans_count: plans.length,
        total_stock
      };
    });

    // Sắp xếp
    if (sort === 'price_asc') {
      formatted.sort((a, b) => a.display_price - b.display_price);
    } else if (sort === 'price_desc') {
      formatted.sort((a, b) => b.display_price - a.display_price);
    } else if (sort === 'newest') {
      formatted.sort((a, b) => b.id - a.id);
    } else {
      formatted.sort((a, b) => (b.sold - a.sold) || (b.id - a.id));
    }

    // Phân trang
    const pNum = Math.max(1, Number(page) || 1);
    const pLimit = Math.max(1, Number(limit) || 20);
    const offset = (pNum - 1) * pLimit;
    const paginated = formatted.slice(offset, offset + pLimit);

    return res.json({ success: true, products: paginated });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách sản phẩm' });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDb();

    const product = await db.collection('products').findOne({ slug, status: 1 });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Lấy plans
    const plans = await db.collection('product_plans')
      .find({ product_id: product.id, status: 1 })
      .sort({ sort_order: 1, price: 1 })
      .toArray();

    // Đếm kho realtime cho từng plan
    const planIds = plans.map(p => p.id);
    const stocks = await db.collection('product_stock')
      .find({ plan_id: { $in: planIds }, status: 1 })
      .toArray();

    const stockMap = {};
    stocks.forEach(s => {
      stockMap[s.plan_id] = (stockMap[s.plan_id] || 0) + 1;
    });

    const formattedPlans = plans.map(p => ({
      ...p,
      price: parseFloat(p.price || 0),
      sale_price: parseFloat(p.sale_price || 0),
      in_stock: stockMap[p.id] || 0
    }));

    // Lấy thông tin danh mục
    let categories = [];
    if (product.category_ids) {
      const catIds = String(product.category_ids).split(',')
        .map(id => Number(id.trim()))
        .filter(Boolean);

      if (catIds.length > 0) {
        categories = await db.collection('categories')
          .find({ id: { $in: catIds } })
          .project({ id: 1, name: 1, slug: 1 })
          .toArray();
      }
    }

    // Sản phẩm liên quan
    const relatedRaw = await db.collection('products')
      .find({ status: 1, id: { $ne: product.id } })
      .sort({ sold: -1 })
      .limit(4)
      .toArray();

    const relatedIds = relatedRaw.map(p => p.id);
    const relatedPlans = await db.collection('product_plans')
      .find({ product_id: { $in: relatedIds }, status: 1 })
      .toArray();

    const relatedMinPriceMap = {};
    relatedPlans.forEach(pl => {
      const pr = parseFloat(pl.price || 0);
      if (!relatedMinPriceMap[pl.product_id] || pr < relatedMinPriceMap[pl.product_id]) {
        relatedMinPriceMap[pl.product_id] = pr;
      }
    });

    const related = relatedRaw.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image || '',
      min_price: relatedMinPriceMap[p.id] || 0,
      rating: parseFloat(p.rating || 5),
      sold: Number(p.sold || 0)
    }));

    return res.json({
      success: true,
      product: {
        ...product,
        categories,
        plans: formattedPlans,
        related
      }
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải chi tiết sản phẩm' });
  }
};
