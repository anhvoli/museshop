import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Search, 
  DollarSign, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Balance adjust modal
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'subtract'
  const [adjustReason, setAdjustReason] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { search } });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Fetch admin users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBalanceModal = (u) => {
    setActiveUser(u);
    setAdjustAmount('');
    setAdjustType('add');
    setAdjustReason('');
    setBalanceModalOpen(true);
    setMsg({ text: '', type: '' });
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    const val = parseFloat(adjustAmount);
    if (isNaN(val) || val <= 0) {
      setMsg({ text: 'Vui lòng nhập số tiền hợp lệ lớn hơn 0', type: 'error' });
      return;
    }

    const finalAmount = adjustType === 'add' ? val : -val;

    try {
      const res = await api.put(`/admin/users/${activeUser.id}/balance`, {
        amount: finalAmount,
        reason: adjustReason
      });

      if (res.data.success) {
        alert(res.data.message);
        setBalanceModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Lỗi điều chỉnh số dư', type: 'error' });
    }
  };

  const handleToggleBan = async (userObj) => {
    const isBanning = userObj.banned !== 1;
    const confirmMsg = isBanning
      ? `Bạn có chắc muốn KHÓA tài khoản "${userObj.username}"?`
      : `Bạn có chắc muốn MỞ KHÓA tài khoản "${userObj.username}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/admin/users/${userObj.id}/status`, {
        banned: isBanning,
        reason: isBanning ? 'Khóa bởi Quản trị viên' : ''
      });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái thành viên');
    }
  };

  const handleToggleRole = async (userObj) => {
    const newRole = userObj.admin >= 1 ? 0 : 1;
    const confirmMsg = newRole === 1
      ? `Cấp quyền QUẢN TRỊ VIÊN cho "${userObj.username}"?`
      : `Thu hồi quyền quản trị của "${userObj.username}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/admin/users/${userObj.id}/role`, {
        admin: newRole
      });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert('Lỗi cập nhật quyền');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Quản lý Thành viên
          </h1>
          <p className="text-xs text-slate-400 mt-1">Cộng/trừ số dư ví, phân quyền và khóa/mở khóa tài khoản</p>
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Tìm theo username hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-slate-950/70 rounded-3xl p-6 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 rounded-l-xl">ID</th>
                <th className="p-3">Tài khoản</th>
                <th className="p-3">Số dư ví</th>
                <th className="p-3">Tổng nạp</th>
                <th className="p-3">Quyền</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3 rounded-r-xl text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/50">
                  <td className="p-3 font-mono text-slate-500">#{u.id}</td>
                  <td className="p-3">
                    <span className="font-bold text-white block text-sm">{u.username}</span>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="p-3 font-extrabold text-emerald-400">
                    {u.money.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3 font-semibold text-slate-400">
                    {u.total_money.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleRole(u)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.admin >= 1 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {u.admin >= 1 ? 'Admin' : 'Thành viên'}
                    </button>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      u.banned === 1 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {u.banned === 1 ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {u.create_date ? new Date(u.create_date).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenBalanceModal(u)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
                        title="Điều chỉnh số dư"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Tiền ví
                      </button>

                      <button
                        onClick={() => handleToggleBan(u)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.banned === 1 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                        }`}
                        title={u.banned === 1 ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {u.banned === 1 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adjust Balance */}
      {balanceModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Điều chỉnh số dư ví
                </h3>
                <p className="text-xs text-slate-400">Thành viên: <strong className="text-white">{activeUser.username}</strong></p>
              </div>
              <button
                onClick={() => setBalanceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg.text && (
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 text-xs">
                {msg.text}
              </div>
            )}

            <form onSubmit={handleAdjustBalance} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Số dư hiện tại:</span>
                <strong className="text-emerald-400 font-bold text-sm">
                  {activeUser.money.toLocaleString('vi-VN')} đ
                </strong>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Loại điều chỉnh:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Cộng tiền vào ví
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('subtract')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      adjustType === 'subtract'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    Trừ tiền khỏi ví
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Số tiền (*)</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Ví dụ: 50000"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Lý do điều chỉnh</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Nạp tiền ngân hàng thủ công, hoàn tiền..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;
