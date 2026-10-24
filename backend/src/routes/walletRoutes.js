import express from 'express';
import { getDepositInfo } from '../controllers/walletController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/deposit-info', requireAuth, getDepositInfo);

export default router;
