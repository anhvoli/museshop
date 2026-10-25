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
import mailRoutes from './routes/mailRoutes.js';

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

// API Routes (Mounted on both /api and root to ensure 100% compatibility across Vercel and local)
const mountRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/categories`, categoryRoutes);
  app.use(`${prefix}/products`, productRoutes);
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/wallet`, walletRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/settings`, settingsRoutes);
  app.use(`${prefix}/mail`, mailRoutes);
  app.get(`${prefix}/health`, (req, res) => {
    res.json({ status: 'ok', database: 'mongodb', time: new Date() });
  });
};

mountRoutes('/api');
mountRoutes('');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên máy chủ' });
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 SHOPKEY API Server running on port ${PORT}`);
      console.log(`👉 http://localhost:${PORT}`);
      console.log(`📧 Mail API: http://localhost:${PORT}/api/mail`);
      console.log(`=========================================`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
