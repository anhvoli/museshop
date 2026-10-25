import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'shopkey';

async function fixTypes() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  // 1. Fix users collection
  console.log('Checking and converting users collection...');
  const users = await db.collection('users').find({}).toArray();
  for (const user of users) {
    const updateFields = {};
    if (typeof user.money === 'string') {
      updateFields.money = parseFloat(user.money || 0);
    }
    if (typeof user.total_money === 'string') {
      updateFields.total_money = parseFloat(user.total_money || 0);
    }
    if (typeof user.debit === 'string') {
      updateFields.debit = parseFloat(user.debit || 0);
    }
    if (typeof user.admin === 'string') {
      updateFields.admin = parseInt(user.admin, 10);
    }
    if (typeof user.banned === 'string') {
      updateFields.banned = parseInt(user.banned, 10);
    }

    if (Object.keys(updateFields).length > 0) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: updateFields }
      );
      console.log(`Updated user ${user.username} (_id: ${user._id}) with:`, updateFields);
    }
  }

  // 2. Fix product_plans collection
  console.log('Checking product_plans collection...');
  const plans = await db.collection('product_plans').find({}).toArray();
  for (const plan of plans) {
    const updateFields = {};
    if (typeof plan.price === 'string') {
      updateFields.price = parseFloat(plan.price || 0);
    }
    if (typeof plan.cost_price === 'string') {
      updateFields.cost_price = parseFloat(plan.cost_price || 0);
    }
    if (typeof plan.sold === 'string') {
      updateFields.sold = parseInt(plan.sold, 10) || 0;
    } else if (plan.sold === undefined || plan.sold === null) {
      updateFields.sold = 0;
    }
    if (Object.keys(updateFields).length > 0) {
      await db.collection('product_plans').updateOne(
        { _id: plan._id },
        { $set: updateFields }
      );
    }
  }
  console.log(`Checked ${plans.length} plans.`);

  // 3. Fix products collection
  console.log('Checking products collection...');
  const products = await db.collection('products').find({}).toArray();
  for (const prod of products) {
    const updateFields = {};
    if (typeof prod.sold === 'string') {
      updateFields.sold = parseInt(prod.sold, 10) || 0;
    } else if (prod.sold === undefined || prod.sold === null) {
      updateFields.sold = 0;
    }
    if (Object.keys(updateFields).length > 0) {
      await db.collection('products').updateOne(
        { _id: prod._id },
        { $set: updateFields }
      );
    }
  }
  console.log(`Checked ${products.length} products.`);

  // Verify lumiltc
  const updatedLumiltc = await db.collection('users').findOne({ username: 'lumiltc' });
  console.log('Verified lumiltc:', {
    money: updatedLumiltc.money,
    typeofMoney: typeof updatedLumiltc.money,
    total_money: updatedLumiltc.total_money,
    typeofTotalMoney: typeof updatedLumiltc.total_money
  });

  await client.close();
  console.log('All types fixed successfully!');
}

fixTypes().catch(console.error);
