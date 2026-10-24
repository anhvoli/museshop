import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShoppingCart, Search, Eye, X, Copy, Check, RotateCcw, Filter } from 'lucide-react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders', {
        params: { status: statusFilter, search }
      });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Fetch admin orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateStatus = async (orderId, newStatus, refund = false) => {
    const confirmMsg = refund 
      ? 'Bạn có chắc muốn HỦY đơn và HOÀN TIỀN vào ví thành viên?' 
      : `Đổi trạng thái đơn sang "${newStatus}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        refund
      });
      if (res.data.success) {
        alert(res.data.message);
        fetchOrders();
        if (viewOrder && viewOrder.id === orderId) {
          setViewOrder(null);
        }
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái đơn');
    }
  };

  const filteredOrders = orders.filter(o =>
    o.trans_id.toLowerCase().includes(search.toLowerCase()) ||
    o.username.toLowerCase().includes(search.toLowerCase()) ||
    o.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-400" />
            Quản lý Đơn hàng toàn sàn
          </h1>
          <p className="text-xs text-slate-400 mt-1">Tra cứu giao dịch, xem mã key xuất xưởng và hoàn tiền khi cần</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành (Đã giao)</option>
            <option value="pending">Đang chờ</option>
            <option value="cancelled">Đã hủy / Hoàn tiền</option>
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã GD, khách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="bg-slate-950/70 rounded-3xl p-6 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 rounded-l-xl">Mã GD</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm & Gói</th>
                <th className="p-3">SL</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3 rounded-r-xl text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-900/50">
                  <td className="p-3 font-mono font-bold text-indigo-400">{ord.trans_id}</td>
                  <td className="p-3">
                    <span className="font-semibold text-white block">{ord.username}</span>
                    <span className="text-[10px] text-slate-400">{ord.email}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold block text-slate-200">{ord.product_name}</span>
                    <span className="text-[11px] text-slate-400">{ord.plan_name}</span>
                  </td>
                  <td className="p-3 font-bold text-white">{ord.quantity}</td>
                  <td className="p-3 font-extrabold text-indigo-400">
                    {ord.final_amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      ord.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ord.status === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {ord.status === 'completed' ? 'Hoàn thành' : ord.status === 'cancelled' ? 'Đã hủy / Hoàn tiền' : ord.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(ord.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setViewOrder(ord)}
                      className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                      title="Xem nội dung key"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Delivery Details & Actions */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Chi tiết Đơn hàng #{viewOrder.id}</h3>
                <p className="text-xs text-slate-400">Mã GD: <strong className="font-mono text-indigo-400">{viewOrder.trans_id}</strong></p>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Khách hàng:</span>
                <strong className="text-white">{viewOrder.username} ({viewOrder.email})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sản phẩm:</span>
                <span className="text-white font-medium">{viewOrder.product_name} - {viewOrder.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số lượng / Tổng tiền:</span>
                <strong className="text-indigo-400">{viewOrder.quantity} x ({viewOrder.final_amount.toLocaleString('vi-VN')} đ)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái hiện tại:</span>
                <span className="font-bold uppercase text-emerald-400">{viewOrder.status}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Nội dung Key / Tài khoản bàn giao:</span>
                <button
                  onClick={() => handleCopy(viewOrder.delivery_content)}
                  className="text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs whitespace-pre-wrap break-all select-all max-h-48 overflow-y-auto border border-slate-800">
                {viewOrder.delivery_content || 'Không có dữ liệu bàn giao'}
              </div>
            </div>

            {/* Refund & Status Actions */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {viewOrder.status !== 'cancelled' && (
                <button
                  onClick={() => handleUpdateStatus(viewOrder.id, 'cancelled', true)}
                  className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Hủy đơn & Hoàn lại {viewOrder.final_amount.toLocaleString('vi-VN')} đ vào ví khách
                </button>
              )}

              <button
                onClick={() => setViewOrder(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
