import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  PackageCheck, 
  Search, 
  Copy, 
  Check, 
  Eye, 
  Clock, 
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredOrders = orders.filter(o => 
    o.trans_id.toLowerCase().includes(search.toLowerCase()) ||
    o.product_name.toLowerCase().includes(search.toLowerCase()) ||
    o.plan_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-indigo-600" />
            Lịch sử đơn hàng
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý và tra cứu key bản quyền, tài khoản bạn đã mua tại SHOPKEY
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Orders Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"></div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  #{order.id}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {order.product_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {order.status === 'completed' ? 'Hoàn thành' : order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Gói: <strong className="text-slate-600 dark:text-slate-300">{order.plan_name}</strong> (SL: {order.quantity})</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Mã GD: <span className="font-mono">{order.trans_id}</span> • {new Date(order.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block">Số tiền:</span>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    {order.total_price.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  onClick={() => setActiveOrder(order)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem Key / TK
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-400">Bạn chưa phát sinh đơn hàng nào trên hệ thống SHOPKEY.</p>
          <Link
            to="/"
            className="inline-block mt-2 px-5 py-2 rounded-full bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
          >
            Mua hàng ngay
          </Link>
        </div>
      )}

      {/* Modal View Delivery Key */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin bàn giao</h3>
                <p className="text-xs text-slate-400">Mã đơn: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeOrder.trans_id}</strong></p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><strong className="text-slate-700 dark:text-slate-300">Sản phẩm:</strong> {activeOrder.product_name}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Gói:</strong> {activeOrder.plan_name}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Số lượng:</strong> {activeOrder.quantity}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Nội dung Key / Tài khoản:</span>
                <button
                  onClick={() => handleCopy(activeOrder.delivery_content)}
                  className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs whitespace-pre-wrap break-all select-all max-h-56 overflow-y-auto border border-slate-800">
                {activeOrder.delivery_content || 'Đang cập nhật nội dung...'}
              </div>
            </div>

            <button
              onClick={() => setActiveOrder(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
