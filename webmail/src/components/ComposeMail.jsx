import React, { useState } from 'react';
import api from '../services/api';
import { Send, X, AlertCircle, CheckCircle2, Mail, Lock } from 'lucide-react';

export default function ComposeMail({ isOpen, onClose, defaultFrom, defaultPassword }) {
  const [from, setFrom] = useState(defaultFrom || '');
  const [password, setPassword] = useState(defaultPassword || '');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!from || !password || !to || !subject) {
      setMsg({ text: 'Vui lòng điền đầy đủ các thông tin bắt buộc', type: 'error' });
      return;
    }

    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await api.sendMail({
        from: from.trim(),
        password: password,
        to: to.trim(),
        subject: subject.trim(),
        text: body,
        html: `<div style="font-family:sans-serif;line-height:1.6;color:#333;">${body.replace(/\n/g, '<br/>')}</div>`
      });

      if (res.success) {
        setMsg({ text: `🎉 Đã gửi thư thành công đến ${to}!`, type: 'success' });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMsg({ text: res.message || 'Lỗi gửi thư', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Soạn Thư Mới (SMTP Port 465 SSL)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {msg.text && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
              msg.type === 'error'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}>
              {msg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Người gửi (From) <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="test01@nckh.anhvoli.id.vn"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mật khẩu hộp thư <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Mật khẩu của hộp thư người gửi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Người nhận (To) <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="ví dụ: bạn bè hoặc chính địa chỉ test01 để tự nhận thử"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tiêu đề thư (Subject) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Tiêu đề thư gửi đi..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nội dung thư
            </label>
            <textarea
              rows="5"
              placeholder="Nội dung thư kiểm tra..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Đang gửi qua SMTP...' : 'Gửi Thư Đi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
