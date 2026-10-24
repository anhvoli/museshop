import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopkey_super_secure_jwt_secret_key_2026');

    const db = getDb();
    const user = await db.collection('users').findOne({ id: Number(decoded.id) });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    if (user.banned == 1) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopkey_super_secure_jwt_secret_key_2026');
      const db = getDb();
      const user = await db.collection('users').findOne({ id: Number(decoded.id) });
      if (user && user.banned != 1) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore invalid optional token
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || Number(req.user.admin) < 1) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập trang quản trị' });
  }
  next();
};
