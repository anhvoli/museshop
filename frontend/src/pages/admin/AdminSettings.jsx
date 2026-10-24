import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Building2, Plus, Trash2, CheckCircle2, AlertCircle, Save, X } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Add Bank Modal State
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankShortName, setBankShortName] = useState('MBBank');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankImage, setBankImage] = useState('https://api.vietqr.io/img/MB.png');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.settings || {});
        setBanks(res.data.banks || []);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        setMsg({ text: 'Lưu cài đặt hệ thống thành công!', type: 'success' });
      }
    } catch (err) {
      setMsg({ text: 'Lỗi khi lưu cài đặt', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    if (!bankShortName || !bankAccountNumber || !bankAccountName) {
      alert('Vui lòng điền đầy đủ thông tin tài khoản');
      return;
    }

    try {
      const res = await api.post('/admin/banks', {
        short_name: bankShortName,
        accountName: bankAccountName,
        accountNumber: bankAccountNumber,
        image: bankImage
      });

      if (res.data.success) {
        setBankModalOpen(false);
        setBankAccountName('');
        setBankAccountNumber('');
        fetchSettings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm ngân hàng');
    }
  };

  const handleDeleteBank = async (bankId) => {
    if (!window.confirm('Bạn có chắc muốn xóa ngân hàng này?')) return;
    try {
      await api.delete(`/admin/banks/${bankId}`);
      fetchSettings();
    } catch (err) {
      alert('Lỗi xóa ngân hàng');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Cài đặt Hệ thống & Ngân hàng
        </h1>
        <p className="text-xs text-slate-400 mt-1">Cấu hình thông tin website, nhận diện thương hiệu và tài khoản VietQR</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* General Settings Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          Thông tin Website & SEO
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Tiêu đề Website (Title)</label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ví dụ: SHOPKEY - Hệ thống bán tài khoản tự động"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Tác giả / Thương hiệu (Author)</label>
              <input
                type="text"
                value={settings.author || ''}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="SHOPKEY"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Mô tả Website (Description SEO)</label>
            <textarea
              rows={2}
              value={settings.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Mô tả website xuất hiện trên Google..."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Đường dẫn Banner / Logo</label>
              <input
                type="text"
                value={settings.image || ''}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Màu chủ đạo (Hex Code)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.theme_color || '#4f46e5'}
                  onChange={(e) => handleInputChange('theme_color', e.target.value)}
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.theme_color || '#4f46e5'}
                  onChange={(e) => handleInputChange('theme_color', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu cài đặt hệ thống'}
            </button>
          </div>
        </form>
      </div>

      {/* Bank Accounts Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Tài khoản Ngân hàng nhận tiền (VietQR)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Các số tài khoản được hiển thị trên trang nạp tiền của khách</p>
          </div>

          <button
            onClick={() => setBankModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Thêm ngân hàng
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {banks.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={b.image || 'https://api.vietqr.io/img/MB.png'}
                  alt={b.short_name}
                  className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-slate-700"
                />
                <div>
                  <span className="font-bold text-white text-sm block">{b.short_name}</span>
                  <span className="font-mono text-indigo-400 font-bold text-xs">{b.accountNumber}</span>
                  <p className="text-[11px] text-slate-400 uppercase">{b.accountName}</p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteBank(b.id)}
                className="p-2 rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                title="Xóa tài khoản"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Bank */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Thêm tài khoản ngân hàng VietQR
              </h3>
              <button onClick={() => setBankModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tên viết tắt ngân hàng (*)</label>
                <select
                  value={bankShortName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBankShortName(val);
                    setBankImage(`https://api.vietqr.io/img/${val}.png`);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="MB">MBBank (Ngân hàng Quân Đội)</option>
                  <option value="VCB">Vietcombank (Ngoại Thương Việt Nam)</option>
                  <option value="ICB">VietinBank (Công Thương Việt Nam)</option>
                  <option value="TCB">Techcombank</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="VPB">VPBank (Việt Nam Thịnh Vượng)</option>
                  <option value="TPB">TPBank (Tiên Phong)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Số tài khoản (*)</label>
                <input
                  type="text"
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 0947838128"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tên chủ tài khoản (Viết hoa không dấu) (*)</label>
                <input
                  type="text"
                  required
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 uppercase font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Thêm ngân hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
