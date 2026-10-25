import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import CPanelApi from './cpanelApi.js';
import ImapClient from './imapClient.js';
import SmtpClient from './smtpClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let runtimeToken = '';

function getCpanelInstance() {
  const token = runtimeToken || process.env.CPANEL_TOKEN;
  return new CPanelApi({
    host: process.env.CPANEL_HOST || 'nckh.anhvoli.id.vn',
    port: process.env.CPANEL_PORT || 2083,
    user: process.env.CPANEL_USER || 'eh8vxynb05pr',
    token: token,
    domain: process.env.MAIL_DOMAIN || 'nckh.anhvoli.id.vn'
  });
}

// ==========================================
// 1. CONFIG & SYSTEM STATUS
// ==========================================
app.get('/api/config', (req, res) => {
  const token = runtimeToken || process.env.CPANEL_TOKEN;
  const hasToken = !!token && token !== 'YOUR_CPANEL_API_TOKEN_HERE';
  res.json({
    success: true,
    config: {
      host: process.env.CPANEL_HOST || 'nckh.anhvoli.id.vn',
      user: process.env.CPANEL_USER || 'eh8vxynb05pr',
      domain: process.env.MAIL_DOMAIN || 'nckh.anhvoli.id.vn',
      imapHost: process.env.IMAP_HOST || 'nckh.anhvoli.id.vn',
      imapPort: Number(process.env.IMAP_PORT || 993),
      smtpHost: process.env.SMTP_HOST || 'nckh.anhvoli.id.vn',
      smtpPort: Number(process.env.SMTP_PORT || 465),
      hasToken: hasToken
    }
  });
});

app.post('/api/config/token', (req, res) => {
  const { token } = req.body;
  if (!token || !token.trim()) {
    return res.status(400).json({ success: false, message: 'Token không được để trống' });
  }
  runtimeToken = token.trim();
  res.json({ success: true, message: 'Đã cập nhật Token cPanel cho phiên làm việc hiện tại!' });
});

// ==========================================
// 2. CPANEL UAPI: QUẢN LÝ HỘP MAIL
// ==========================================

// Liệt kê danh sách hộp mail
app.get('/api/cpanel/mailboxes', async (req, res) => {
  try {
    const cpanel = getCpanelInstance();
    const mailboxes = await cpanel.listMailboxes();
    res.json({ success: true, mailboxes });
  } catch (err) {
    console.error('List mailboxes error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Tạo hộp mail mới
app.post('/api/cpanel/mailboxes', async (req, res) => {
  try {
    const { email, password, quota, domain } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên hộp mail và mật khẩu' });
    }

    const cpanel = getCpanelInstance();
    const result = await cpanel.createMailbox({
      email,
      password,
      quota: Number(quota) || 1024,
      domain: domain || process.env.MAIL_DOMAIN || 'nckh.anhvoli.id.vn'
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Create mailbox error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa hộp mail
app.delete('/api/cpanel/mailboxes', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email cần xóa' });
    }

    const cpanel = getCpanelInstance();
    const result = await cpanel.deleteMailbox(email);
    res.json(result);
  } catch (err) {
    console.error('Delete mailbox error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Đổi mật khẩu hộp mail
app.post('/api/cpanel/mailboxes/password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email và mật khẩu mới' });
    }

    const cpanel = getCpanelInstance();
    const result = await cpanel.changePassword(email, newPassword);
    res.json(result);
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. IMAP: ĐỌC THƯ
// ==========================================
app.post('/api/mail/inbox', async (req, res) => {
  try {
    const { email, password, limit = 20 } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email đầy đủ và mật khẩu hộp mail để đọc thư qua IMAP'
      });
    }

    const imap = new ImapClient({
      host: process.env.IMAP_HOST || 'nckh.anhvoli.id.vn',
      port: Number(process.env.IMAP_PORT || 993),
      user: email.trim(),
      password: password
    });

    const data = await imap.getInbox(Number(limit) || 20);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('IMAP inbox error:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi IMAP: ' + err.message });
  }
});

// ==========================================
// 4. SMTP: GỬI THƯ THỬ NGHIỆM
// ==========================================
app.post('/api/mail/send', async (req, res) => {
  try {
    const { from, password, to, subject, text, html } = req.body;
    if (!from || !password || !to) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: người gửi (from), mật khẩu, người nhận (to)'
      });
    }

    const smtp = new SmtpClient({
      host: process.env.SMTP_HOST || 'nckh.anhvoli.id.vn',
      port: Number(process.env.SMTP_PORT || 465),
      user: from.trim(),
      password: password
    });

    const result = await smtp.sendMail({ to, subject, text, html });
    res.json(result);
  } catch (err) {
    console.error('SMTP send error:', err.message);
    res.status(500).json({ success: false, message: 'Lỗi SMTP: ' + err.message });
  }
});

// Serve frontend dist if exists
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Webmail & cPanel API Server đang chạy tại:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`- Domain:   ${process.env.MAIL_DOMAIN || 'nckh.anhvoli.id.vn'}`);
  console.log(`- cPanel:   ${process.env.CPANEL_USER || 'eh8vxynb05pr'}`);
  console.log(`- IMAP:     ${process.env.IMAP_HOST || 'nckh.anhvoli.id.vn'}:993 (SSL)`);
  console.log(`- SMTP:     ${process.env.SMTP_HOST || 'nckh.anhvoli.id.vn'}:465 (SSL)`);
  console.log(`=======================================================`);
});
