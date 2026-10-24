import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Key, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  RefreshCw, 
  Eye, 
  Trash2, 
  X, 
  Copy, 
  Check 
} from 'lucide-react';

const AdminStock = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [rawKeys, setRawKeys] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Key inspection state
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectPlan, setInspectPlan] = useState(null);
  const [keysList, setKeysList] = useState([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keyFilterStatus, setKeyFilterStatus] = useState('1'); // 1: in stock, 0: sold
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  useEffect(() => {
    fetchStockPlans();
  }, []);

  const fetchStockPlans = async () => {
    try {
      const res = await api.get('/admin/stocks');
      if (res.data.success) {
        setPlans(res.data.plans);
        if (res.data.plans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(res.data.plans[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Fetch stock plans error:', err);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedPlanId || !rawKeys.trim()) {
      setMsg({ text: 'Vui lòng chọn gói sản phẩm và dán danh sách key', type: 'error' });
      return;
    }

    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await api.post('/admin/stocks/import', {
        plan_id: selectedPlanId,
        raw_keys: rawKeys
      });

      if (res.data.success) {
        setMsg({ text: res.data.message, type: 'success' });
        setRawKeys('');
        fetchStockPlans();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Lỗi khi nhập kho', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openInspectModal = async (plan) => {
    setInspectPlan(plan);
    setInspectModalOpen(true);
    fetchPlanKeys(plan.id, keyFilterStatus);
  };

  const fetchPlanKeys = async (planId, status) => {
    setKeysLoading(true);
    try {
      const res = await api.get(`/admin/stocks/keys/${planId}?status=${status}`);
      if (res.data.success) {
        setKeysList(res.data.keys);
      }
    } catch (err) {
      console.error('Fetch keys error:', err);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Bạn có chắc muốn xóa key này khỏi kho?')) return;
    try {
      await api.delete(`/admin/stocks/keys/${keyId}`);
      setKeysList(keysList.filter(k => k.id !== keyId));
      fetchStockPlans();
    } catch (err) {
      alert('Lỗi xóa key');
    }
  };

  const handleCopyKey = (keyId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const lineCount = rawKeys.split('\n').filter(k => k.trim().length > 0).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Key className="w-6 h-6 text-indigo-400" />
          Quản lý Kho Key & Tài khoản
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Nhập thêm tài khoản, license key tự động giao cho khách hàng khi mua
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Import Form */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Thêm Key / Tài khoản hàng loạt
            </h2>

            {msg.text && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handleImport} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Chọn gói sản phẩm:
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} - {p.plan_name} (Hiện còn: {p.available_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-300">
                    Danh sách Key / Tài khoản (Mỗi dòng 1 key):
                  </label>
                  <span className="text-[11px] font-bold text-indigo-400">
                    {lineCount} dòng
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={rawKeys}
                  onChange={(e) => setRawKeys(e.target.value)}
                  placeholder="KEY1-XXXX-YYYY-ZZZZ&#10;user@gmail.com|password123&#10;KEY2-AAAA-BBBB-CCCC"
                  className="w-full p-3.5 rounded-xl font-mono bg-slate-900 border border-slate-700 text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || lineCount === 0}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Đang nhập...' : `Nhập ${lineCount} key vào kho`}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Stock Inventory Table */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                Tình trạng tồn kho theo gói
              </h2>
              <button
                onClick={fetchStockPlans}
                className="p-1.5 text-slate-400 hover:text-white"
                title="Làm mới"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold sticky top-0">
                  <tr>
                    <th className="p-3 rounded-l-xl">Sản phẩm / Gói</th>
                    <th className="p-3">Giá bán</th>
                    <th className="p-3">Sẵn có</th>
                    <th className="p-3">Đã bán</th>
                    <th className="p-3 rounded-r-xl text-center">Xem key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {plans.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-semibold">
                        <span className="block text-white text-sm">{p.product_name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{p.plan_name}</span>
                      </td>
                      <td className="p-3 font-bold text-indigo-400">
                        {p.price.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.available_stock > 0 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {p.available_stock} key
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-medium">
                        {p.sold_stock}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openInspectModal(p)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold flex items-center gap-1 mx-auto transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Inspect Keys of Selected Plan */}
      {inspectModalOpen && inspectPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  Danh sách Key: {inspectPlan.product_name} - {inspectPlan.plan_name}
                </h3>
                <p className="text-xs text-slate-400">Xem và quản lý các mã key / tài khoản trong gói</p>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  setKeyFilterStatus('1');
                  fetchPlanKeys(inspectPlan.id, '1');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold ${
                  keyFilterStatus === '1'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Chưa bán (Sẵn sàng)
              </button>
              <button
                onClick={() => {
                  setKeyFilterStatus('0');
                  fetchPlanKeys(inspectPlan.id, '0');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold ${
                  keyFilterStatus === '0'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Đã bán
              </button>
            </div>

            {/* Keys Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Nội dung Key / Tài khoản</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {keysLoading ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">Đang tải danh sách key...</td>
                    </tr>
                  ) : keysList.length > 0 ? (
                    keysList.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-950/50">
                        <td className="p-3 font-mono text-slate-500">#{k.id}</td>
                        <td className="p-3 font-mono text-emerald-400 break-all select-all">
                          {k.stock_value}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            k.status === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {k.status === 1 ? 'Chưa bán' : `Đã bán (Đơn #${k.order_id || 'N/A'})`}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCopyKey(k.id, k.stock_value)}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                              title="Sao chép"
                            >
                              {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteKey(k.id)}
                              className="p-1 rounded bg-slate-800 text-rose-400 hover:text-rose-300"
                              title="Xóa key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">Không có key nào trong danh mục này.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setInspectModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStock;
