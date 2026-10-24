import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Ticket, Plus, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(100);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      if (res.data.success) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!code || !value) {
      setMsg({ text: 'Vui lòng nhập mã và mức giảm', type: 'error' });
      return;
    }

    try {
      const res = await api.post('/admin/coupons', {
        code,
        type,
        value: Number(value),
        min_order_amount: Number(minOrder) || 0,
        max_discount_amount: Number(maxDiscount) || 0,
        usage_limit: Number(usageLimit) || 100,
        status: 1
      });

      if (res.data.success) {
        setModalOpen(false);
        setCode('');
        setValue('');
        fetchCoupons();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Lỗi khi tạo mã giảm giá', type: 'error' });
    }
  };

  const handleDeleteCoupon = async (id, cCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mã giảm giá "${cCode}"?`)) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert('Lỗi xóa mã');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-400" />
            Quản lý Mã giảm giá (Coupons)
          </h1>
          <p className="text-xs text-slate-400 mt-1">Tạo mã voucher khuyến mãi giảm theo % hoặc số tiền cố định</p>
        </div>

        <button
          onClick={() => {
            setModalOpen(true);
            setMsg({ text: '', type: '' });
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tạo mã giảm giá mới
        </button>
      </div>

      <div className="bg-slate-950/70 rounded-3xl p-6 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 rounded-l-xl">Mã code</th>
                <th className="p-3">Loại giảm</th>
                <th className="p-3">Mức giảm</th>
                <th className="p-3">Đơn tối thiểu</th>
                <th className="p-3">Lượt dùng</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 rounded-r-xl text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/50">
                  <td className="p-3 font-mono font-bold text-white text-sm bg-slate-900/40">
                    {c.code}
                  </td>
                  <td className="p-3 capitalize text-slate-400">
                    {c.type === 'percentage' ? 'Phần trăm (%)' : 'Số tiền cố định'}
                  </td>
                  <td className="p-3 font-extrabold text-emerald-400 text-sm">
                    {c.type === 'percentage' ? `${c.value}%` : `${c.value.toLocaleString('vi-VN')} đ`}
                  </td>
                  <td className="p-3 text-slate-300">
                    {c.min_order_amount > 0 ? `${c.min_order_amount.toLocaleString('vi-VN')} đ` : 'Không giới hạn'}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-indigo-400">{c.used_count || 0}</span> / {c.usage_limit || '∞'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      c.status === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {c.status === 1 ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteCoupon(c.id, c.code)}
                      className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                      title="Xóa mã"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Coupon */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-400" />
                Tạo mã giảm giá mới
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg.text && (
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 text-xs">
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mã giảm giá (*)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: SALE50, CHAOMUNG"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Loại giảm:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Theo Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Mức giảm (*):</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === 'percentage' ? '10 (nghĩa là 10%)' : '20000'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Đơn tối thiểu (đ)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Giới hạn số lượt dùng</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="100"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Tạo mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
