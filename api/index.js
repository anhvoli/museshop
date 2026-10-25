import app from '../backend/src/server.js';
import { connectDB } from '../backend/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to MongoDB in Vercel function:', err);
  }
  return app(req, res);
}
