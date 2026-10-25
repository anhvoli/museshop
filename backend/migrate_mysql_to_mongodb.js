import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://anhvoli826_db_user:BOUrfUbsKQtfBAHt@cluster0.haytjme.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = process.env.DB_NAME || "shopkey";

async function migrate() {
  console.log('🔄 Bắt đầu sao chép dữ liệu từ MySQL sang MongoDB Atlas...');

  // 1. Kết nối MySQL
  let mysqlConn;
  try {
    mysqlConn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'shopkey',
      password: 'shopkey',
      database: 'shopkey'
    });
    console.log('✅ Đã kết nối MySQL cục bộ');
  } catch (err) {
    console.error('❌ Không thể kết nối MySQL:', err.message);
    return;
  }

  // 2. Kết nối MongoDB Atlas
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });
    await mongoClient.connect();
    console.log(`✅ Đã kết nối MongoDB Atlas: Database "${DB_NAME}"`);
  } catch (err) {
    console.error('❌ Không thể kết nối MongoDB Atlas:', err.message);
    if (mysqlConn) await mysqlConn.end();
    return;
  }

  const db = mongoClient.db(DB_NAME);

  // 3. Lấy tất cả bảng có dữ liệu trong MySQL
  const [tables] = await mysqlConn.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);

  const maxIds = {};

  for (const tableName of tableNames) {
    try {
      const [rows] = await mysqlConn.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length === 0) continue;

      const col = db.collection(tableName);
      await col.deleteMany({}); // Xóa dữ liệu cũ nếu chạy lại

      // Chuyển đổi định dạng nếu cần
      const docs = rows.map(r => {
        const doc = { ...r };
        // Giữ id gốc dạng số
        if (doc.id !== undefined && doc.id !== null) {
          doc.id = Number(doc.id);
          if (!maxIds[tableName] || doc.id > maxIds[tableName]) {
            maxIds[tableName] = doc.id;
          }
        }

        // Đảm bảo các trường tiền tệ / số liệu là kiểu Number
        const numericKeys = ['money', 'total_money', 'debit', 'price', 'cost_price', 'sale_price', 'total_price', 'final_amount', 'sold', 'amount'];
        for (const key of numericKeys) {
          if (doc[key] !== undefined && doc[key] !== null) {
            doc[key] = Number(doc[key]);
          }
        }

        return doc;
      });

      if (docs.length > 0) {
        await col.insertMany(docs);
        console.log(` 📦 Đã sao chép bảng "${tableName}": ${docs.length} bản ghi sang MongoDB`);
      }
    } catch (tblErr) {
      console.warn(` ⚠️ Lỗi bảng "${tableName}":`, tblErr.message);
    }
  }

  // 4. Khởi tạo bộ đếm ID cho các collection (Sequence Counters)
  const counterCol = db.collection('counters');
  await counterCol.deleteMany({});
  for (const [colName, maxVal] of Object.entries(maxIds)) {
    await counterCol.insertOne({ _id: colName, seq: maxVal });
  }
  console.log('✅ Đã khởi tạo bộ đếm Auto-increment ID cho các collection:', maxIds);

  console.log('\n🎉 Hoàn thành chuyển đổi toàn bộ database sang MongoDB Atlas thành công!');

  await mysqlConn.end();
  await mongoClient.close();
}

migrate().catch(console.error);
