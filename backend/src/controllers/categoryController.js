import { getDb } from '../config/db.js';

export const getCategories = async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.collection('categories')
      .find({ status: 'show' })
      .sort({ stt: 1, id: 1 })
      .toArray();

    const formatted = rows.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon || '',
      description: c.description || '',
      stt: c.stt || 0
    }));

    return res.json({ success: true, categories: formatted });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh mục' });
  }
};
