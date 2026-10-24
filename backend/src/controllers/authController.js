import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, getNextSequence } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'shopkey_super_secure_jwt_secret_key_2026';

const comparePassword = (plainPassword, hashedPassword) => {
  if (!hashedPassword) return false;
  // If MD5
  if (hashedPassword.length === 32 && !hashedPassword.startsWith('$')) {
    return false;
  }
  // Normalize PHP $2y$ or $2b$ to $2a$ for bcryptjs
  const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$').replace(/^\$2b\$/, '$2a$');
  return bcrypt.compareSync(plainPassword, normalizedHash);
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const db = getDb();
    const cleanUser = username.trim();

    const user = await db.collection('users').findOne({
      $or: [
        { username: { $regex: new RegExp(`^${cleanUser}$`, 'i') } },
        { email: { $regex: new RegExp(`^${cleanUser}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    if (Number(user.banned) === 1) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Lý do: ' + (user.reason_banned || 'Không có') });
    }

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, admin: Number(user.admin) || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update IP and login date
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          ip: req.ip || '127.0.0.1',
          update_date: new Date()
        }
      }
    );

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        money: parseFloat(user.money || 0),
        total_money: parseFloat(user.total_money || 0),
        admin: Number(user.admin) || 0,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập' });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu nhập lại không khớp' });
    }

    const db = getDb();
    const cleanUser = username.trim();
    const cleanEmail = email.trim();

    // Check if username or email exists
    const existing = await db.collection('users').findOne({
      $or: [
        { username: { $regex: new RegExp(`^${cleanUser}$`, 'i') } },
        { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } }
      ]
    });

    if (existing) {
      if (existing.username.toLowerCase() === cleanUser.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Tên đăng nhập đã được sử dụng' });
      }
      return res.status(400).json({ success: false, message: 'Địa chỉ email đã được sử dụng' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUserId = await getNextSequence('users');
    const userToken = jwt.sign({ username: cleanUser }, JWT_SECRET, { expiresIn: '7d' });

    const newUserDoc = {
      id: newUserId,
      username: cleanUser,
      email: cleanEmail,
      password: hashedPassword,
      fullname: cleanUser,
      money: 0,
      total_money: 0,
      admin: 0,
      banned: 0,
      token: userToken,
      ip: req.ip || '127.0.0.1',
      create_date: new Date(),
      update_date: new Date()
    };

    await db.collection('users').insertOne(newUserDoc);

    const authToken = jwt.sign(
      { id: newUserId, username: cleanUser, admin: 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token: authToken,
      user: {
        id: newUserId,
        username: cleanUser,
        email: cleanEmail,
        fullname: cleanUser,
        money: 0,
        total_money: 0,
        admin: 0
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký' });
  }
};

export const getMe = async (req, res) => {
  try {
    const db = getDb();
    const user = await db.collection('users').findOne({ id: Number(req.user.id) });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone || '',
        money: parseFloat(user.money || 0),
        total_money: parseFloat(user.total_money || 0),
        admin: Number(user.admin) || 0,
        avatar: user.avatar || '',
        create_date: user.create_date
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin người dùng' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ mật khẩu cũ và mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
    }

    const db = getDb();
    const user = await db.collection('users').findOne({ id: Number(req.user.id) });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const isMatch = comparePassword(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
    }

    const newHashed = bcrypt.hashSync(newPassword, 10);
    await db.collection('users').updateOne(
      { id: Number(req.user.id) },
      { $set: { password: newHashed, update_date: new Date() } }
    );

    return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu' });
  }
};
