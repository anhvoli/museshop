import { CPanelMailService, ImapMailService, SmtpMailService } from '../services/mailService.js';

/**
 * Controller xử lý các API Email (cPanel UAPI + IMAP + SMTP)
 */

// 1. Lấy danh sách hộp thư
export const getMailboxes = async (req, res) => {
  try {
    const cpanel = new CPanelMailService();
    const mailboxes = await cpanel.listMailboxes();
    return res.json({
      success: true,
      total: mailboxes.length,
      mailboxes
    });
  } catch (error) {
    console.error('getMailboxes error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Tạo hộp thư mới
export const createMailbox = async (req, res) => {
  try {
    const { email, password, quota, domain } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên hộp mail (email)' });
    }

    const cpanel = new CPanelMailService();
    const result = await cpanel.createMailbox({
      email,
      password,
      quota: Number(quota) || 1024,
      domain
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('createMailbox error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Xóa hộp thư
export const deleteMailbox = async (req, res) => {
  try {
    const email = req.query.email || req.body.email || req.params.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email cần xóa' });
    }

    const cpanel = new CPanelMailService();
    const result = await cpanel.deleteMailbox(email);
    return res.json(result);
  } catch (error) {
    console.error('deleteMailbox error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Đổi mật khẩu hộp thư
export const changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và newPassword' });
    }

    const cpanel = new CPanelMailService();
    const result = await cpanel.changePassword(email, newPassword);
    return res.json(result);
  } catch (error) {
    console.error('changePassword error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Đọc thư từ hộp mail qua IMAP (Port 993 SSL)
export const getInbox = async (req, res) => {
  try {
    const { email, password, limit = 20 } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và password của hộp thư để kết nối IMAP'
      });
    }

    const imap = new ImapMailService({
      user: email.trim(),
      password: password
    });

    const data = await imap.getInbox(Number(limit) || 20);
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error('getInbox error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi IMAP: ' + error.message });
  }
};

// 6. Tự động bóc tách mã OTP / Mã xác nhận từ thư mới nhất
export const getLatestOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và password của hộp thư'
      });
    }

    const imap = new ImapMailService({
      user: email.trim(),
      password: password
    });

    const result = await imap.getLatestOtp();
    return res.json(result);
  } catch (error) {
    console.error('getLatestOtp error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi lấy OTP: ' + error.message });
  }
};

// 7. Gửi thư qua SMTP (Port 465 SSL)
export const sendMail = async (req, res) => {
  try {
    const { from, password, to, subject, text, html } = req.body;
    if (!from || !password || !to) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp: from (email người gửi), password, to (người nhận)'
      });
    }

    const smtp = new SmtpMailService({
      user: from.trim(),
      password: password
    });

    const result = await smtp.sendMail({ to, subject, text, html });
    return res.json(result);
  } catch (error) {
    console.error('sendMail error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi SMTP: ' + error.message });
  }
};
