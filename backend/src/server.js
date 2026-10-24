import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (images, logos, avatars)
const frontendAssetsPath = path.resolve(__dirname, '../../frontend/public/assets');
const originalAssetsPath = path.resolve(__dirname, '../../SHOPKEY-main/assets');

if (fs.existsSync(frontendAssetsPath)) {
  app.use('/assets', express.static(frontendAssetsPath));
} else if (fs.existsSync(originalAssetsPath)) {
  app.use('/assets', express.static(originalAssetsPath));
}

const frontendPublicPath = path.resolve(__dirname, '../../frontend/public');
const originalPublicPath = path.resolve(__dirname, '../../SHOPKEY-main/public');

if (fs.existsSync(frontendPublicPath)) {
  app.use('/public', express.static(frontendPublicPath));
} else if (fs.existsSync(originalPublicPath)) {
  app.use('/public', express.static(originalPublicPath));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'mongodb', time: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên máy chủ' });
});

// If running as standard standalone Node process (not serverless)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Shopkey Node.js Backend API is running on http://localhost:${PORT} (Powered by MongoDB Atlas)`);
      });
    })
    .catch((err) => {
      console.error('Không thể khởi động server do lỗi kết nối MongoDB:', err);
      process.exit(1);
    });
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

export { app };
