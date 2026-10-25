import express from 'express';
import { getPublicSettings, getPublicBanners } from '../controllers/settingsController.js';

const router = express.Router();
router.get('/', getPublicSettings);
router.get('/banners', getPublicBanners);

export default router;
