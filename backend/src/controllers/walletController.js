import { getDb } from '../config/db.js';

export const getDepositInfo = async (req, res) => {
  try {
    const db = getDb();
    const banks = await db.collection('banks')
      .find({ status: 1 })
      .toArray();

    const formattedBanks = banks.map(b => ({
      id: b.id,
      short_name: b.short_name,
      image: b.image || '',
      accountName: b.accountName,
      accountNumber: b.accountNumber
    }));

    const userSyntax = `NAP ${req.user.username}`;

    return res.json({
      success: true,
      banks: formattedBanks,
      syntax: userSyntax,
      user: {
        username: req.user.username,
        money: parseFloat(req.user.money || 0)
      }
    });
  } catch (error) {
    console.error('Get deposit info error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin nạp tiền' });
  }
};
