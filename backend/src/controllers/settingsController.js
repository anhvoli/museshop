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

export const getPublicBanners = async (req, res) => {
  try {
    const { position } = req.query;
    const db = getDb();

    const filter = { status: 1 };
    if (position) {
      filter.position = position;
    }

    const banners = await db.collection('banners')
      .find(filter)
      .sort({ sort_order: -1, id: -1 })
      .toArray();

    return res.json({
      success: true,
      banners: banners.map(b => ({
        id: b.id,
        title: b.title || '',
        image: b.image || '',
        link: b.link || '',
        position: b.position || 'below_sliders',
        sort_order: Number(b.sort_order) || 0
      }))
    });
  } catch (error) {
    console.error('Get public banners error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy banner trang web' });
  }
};
