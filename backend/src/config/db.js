import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://anhvoli826_db_user:BOUrfUbsKQtfBAHt@cluster0.haytjme.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = process.env.DB_NAME || "shopkey";

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ Đã kết nối thành công MongoDB Atlas (Database: ${DB_NAME})`);
    return db;
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB Atlas:', err.message);
    throw err;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database chưa được khởi tạo. Hãy gọi connectDB() trước.');
  }
  return db;
}

// Hàm lấy ID tự tăng dạng số tương tự auto-increment của MySQL
export async function getNextSequence(sequenceName) {
  const database = getDb();
  const counterCol = database.collection('counters');
  const result = await counterCol.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result.seq || result.value?.seq || 1;
}

// Khởi chạy kết nối ngay khi import
connectDB().catch(err => {
  console.error('Không thể kết nối ban đầu tới MongoDB:', err);
});

export default {
  connectDB,
  getDb,
  getNextSequence
};
