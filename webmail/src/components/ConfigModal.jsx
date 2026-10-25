import React, { useState } from 'react';
import api from '../services/api';
import { Key, ShieldAlert, CheckCircle2, X, ExternalLink, HelpCircle } from 'lucide-react';

export default function ConfigModal({ isOpen, onClose, config, onConfigUpdated }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await api.setToken(token.trim());
      if (res.success) {
        setMsg({ text: '✅ Đã lưu Token cPanel thành công!', type: 'success' });
        onConfigUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMsg({ text: res.message, type: 'error' });
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Cấu Hình API Token cPanel</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Lưu ý quan trọng về bảo mật:</p>
            <p className="leading-relaxed">
              API token của cPanel có toàn quyền quản trị như tài khoản cPanel của bạn. Token chỉ hiện 1 lần duy nhất lúc tạo trong 
              <span className="font-mono text-white"> cPanel &gt; Security &gt; Manage API Tokens</span>.
            </p>
          </div>
        </div>

        {msg.text && (
          <div className={`p-3 rounded-xl text-xs ${
            msg.type === 'error' ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'
          }`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dán API Token cPanel vào đây:
            </label>
            <input
              type="password"
              required
              placeholder="Dán token tạo từ Manage API Tokens..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Hosting cPanel:</span>
              <span className="text-white font-mono">{config?.host || 'nckh.anhvoli.id.vn'}</span>
            </div>
            <div className="flex justify-between">
              <span>Tài khoản cPanel:</span>
              <span className="text-emerald-400 font-mono">{config?.user || 'eh8vxynb05pr'}</span>
            </div>
            <div className="flex justify-between">
              <span>Tên miền:</span>
              <span className="text-indigo-400 font-mono">{config?.domain || 'nckh.anhvoli.id.vn'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {loading ? 'Đang lưu...' : 'Lưu Token Sử Dụng'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
