import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Key, 
  ArrowUpRight, 
  ShieldCheck,
  Clock,
  TrendingUp,
  Activity,
  Layers,
  Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setChartData(res.data.chartData || []);
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (err) {
      console.error('Fetch admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxRevenue = Math.max(...chartData.map(c => c.revenue), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Tổng quan Hệ thống
          </h1>
          <p className="text-xs text-slate-400 mt-1">Báo cáo doanh thu, đơn hàng và kho dữ liệu tự động 24/7</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/stocks"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs flex items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Key className="w-4 h-4" />
            Nhập kho Key / TK
          </Link>
          <Link
            to="/admin/products"
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <Package className="w-4 h-4 text-indigo-400" />
            Quản lý Sản phẩm
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Doanh thu hôm nay</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {stats.revenueToday.toLocaleString('vi-VN')} đ
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Tổng doanh thu:</span>
              <strong className="text-emerald-400">{stats.totalRevenue.toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Đơn hàng hôm nay</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {stats.ordersToday} <span className="text-xs font-normal text-slate-400">đơn</span>
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Tổng số đơn sàn:</span>
              <strong className="text-indigo-400">{stats.totalOrders} đơn</strong>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Tổng thành viên</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {stats.totalUsers}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Tài khoản:</span>
              <span className="text-purple-400">Đã đăng ký</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Key sẵn trong kho</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">
              {stats.totalStock}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Sản phẩm active:</span>
              <strong className="text-amber-400">{stats.totalProducts} sản phẩm</strong>
            </div>
          </div>
        </div>
      )}

      {/* Revenue 7 Days Bar Chart */}
      {chartData.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Doanh thu 7 ngày gần nhất
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Thống kê biểu đồ doanh số bán hàng tự động</p>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-slate-800 pb-2">
            {chartData.map((col, idx) => {
              const heightPercent = Math.max(12, Math.round((col.revenue / maxRevenue) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {col.revenue > 0 ? `${(col.revenue / 1000).toFixed(0)}k` : '0'}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-t from-indigo-700 to-indigo-500 group-hover:from-indigo-600 group-hover:to-purple-500 transition-all duration-300 shadow-md shadow-indigo-600/20"
                  />
                  <span className="text-[11px] text-slate-400 font-medium">{col.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-slate-950/70 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Đơn hàng gần đây
          </h2>
          <Link to="/admin/orders" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
            Xem tất cả đơn
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 rounded-l-xl">Mã GD</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Gói</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 rounded-r-xl">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-900/50">
                  <td className="p-3 font-mono font-bold text-indigo-400">{ord.trans_id}</td>
                  <td className="p-3 font-semibold text-white">{ord.username}</td>
                  <td className="p-3">{ord.product_name}</td>
                  <td className="p-3 text-slate-400">{ord.plan_name}</td>
                  <td className="p-3 font-bold text-white">
                    {ord.final_amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {ord.status === 'completed' ? 'Hoàn thành' : ord.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(ord.created_at).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
