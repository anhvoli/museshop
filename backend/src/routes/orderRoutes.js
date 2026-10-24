import express from 'express';
import { checkout, getMyOrders, getOrderDetail } from '../controllers/orderController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/checkout', requireAuth, checkout);
router.get('/', requireAuth, getMyOrders);
router.get('/:transId', requireAuth, getOrderDetail);

export default router;
