import express from 'express';
import {
  getMailboxes,
  createMailbox,
  deleteMailbox,
  changePassword,
  getInbox,
  getLatestOtp,
  sendMail
} from '../controllers/mailController.js';

const router = express.Router();

// 1. Quản lý hộp thư cPanel UAPI
router.get('/list', getMailboxes);
router.get('/mailboxes', getMailboxes);
router.post('/create', createMailbox);
router.delete('/delete', deleteMailbox);
router.delete('/:email', deleteMailbox);
router.post('/password', changePassword);

// 2. Đọc thư IMAP (Port 993 SSL)
router.post('/inbox', getInbox);
router.post('/otp', getLatestOtp);
router.post('/read-otp', getLatestOtp);

// 3. Gửi thư SMTP (Port 465 SSL)
router.post('/send', sendMail);

export default router;
