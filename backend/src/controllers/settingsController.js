import { getDb } from '../config/db.js';

export const getPublicSettings = async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.collection('settings')
      .find({
        name: { $in: ['title', 'description', 'keywords', 'author', 'image', 'favicon', 'theme_color', 'theme_color1'] }
      })
      .toArray();

    const settings = {};
    rows.forEach(r => {
      settings[r.name] = r.value;
    });

    return res.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy cài đặt hệ thống' });
  }
};
