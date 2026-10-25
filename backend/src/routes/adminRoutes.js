import express from 'express';
import {
  getStats,
  // Categories
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Products
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  // Plans
  getProductPlans,
  createPlan,
  updatePlan,
  deletePlan,
  // Stock
  getStockPlans,
  getPlanKeys,
  deleteStockKey,
  importStock,
  // Orders
  getAdminOrders,
  updateOrderStatus,
  // Users
  getAdminUsers,
  adjustUserBalance,
  toggleUserBan,
  updateUserRole,
  // Coupons
  getAdminCoupons,
  createCoupon,
  deleteCoupon,
  // Banners
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  // Settings & Banks
  getAllSettings,
  saveSettings,
  addBank,
  deleteBank
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/stats', getStats);

// Categories
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Products
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Plans
router.get('/plans/:productId', getProductPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// Stock
router.get('/stocks', getStockPlans);
router.get('/stocks/keys/:planId', getPlanKeys);
router.delete('/stocks/keys/:id', deleteStockKey);
router.post('/stocks/import', importStock);

// Orders
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Users
router.get('/users', getAdminUsers);
router.put('/users/:id/balance', adjustUserBalance);
router.put('/users/:id/status', toggleUserBan);
router.put('/users/:id/role', updateUserRole);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Banners
router.get('/banners', getAdminBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);
router.put('/banners/:id/status', toggleBannerStatus);

// Settings
router.get('/settings', getAllSettings);
router.put('/settings', saveSettings);
router.post('/banks', addBank);
router.delete('/banks/:id', deleteBank);

export default router;
