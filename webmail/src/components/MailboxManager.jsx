import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Mail, 
  Plus, 
  Trash2, 
  Key, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Inbox, 
  HardDrive,
  Lock,
  Sparkles
} from 'lucide-react';

export default function MailboxManager({ config, onOpenInbox }) {
  const [mailboxes, setMailboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Form create
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [quota, setQuota] = useState(1024);
  const [copiedPass, setCopiedPass] = useState(false);

  // Modal change pass
  const [passModal, setPassModal] = useState({ open: false, email: '', newPassword: '' });

  const targetDomain = config?.domain || 'nckh.anhvoli.id.vn';

  useEffect(() => {
    loadMailboxes();
  }, []);

  const loadMailboxes = async () => {
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await api.getMailboxes();
      if (res.success) {
        setMailboxes(res.mailboxes || []);
      } else {
        setMsg({ text: res.message || 'Lỗi khi tải danh sách hộp mail', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = 'Mk@';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setMsg({ text: 'Vui lòng nhập tên hộp mail và mật khẩu', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await api.createMailbox({
        email: newEmail.trim(),
        password: newPassword.trim(),
        quota: Number(quota) || 1024,
        domain: targetDomain
      });

      if (res.success) {
        setMsg({ text: `🎉 Đã tạo thành công hộp thư ${res.email}! Bạn có thể chuyển sang tab Đọc Thư để sử dụng.`, type: 'success' });
        setNewEmail('');
        setNewPassword('');
        loadMailboxes();
      } else {
        setMsg({ text: res.message || 'Không thể tạo hộp mail', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hộp thư: ${email}? Toàn bộ thư trong hộp này sẽ bị xóa vĩnh viễn.`)) {
      return;
    }

    try {
      const res = await api.deleteMailbox(email);
      if (res.success) {
        setMsg({ text: `Đã xóa hộp thư ${email}`, type: 'success' });
        loadMailboxes();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passModal.newPassword) return;

    try {
      const res = await api.changePassword(passModal.email, passModal.newPassword);
      if (res.success) {
        alert(`Đã đổi mật khẩu cho ${passModal.email} thành công!`);
        setPassModal({ open: false, email: '', newPassword: '' });
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Alert banner */}
      {msg.text && (
        <div className={`p-4 rounded-2xl text-sm flex items-start gap-3 border animate-fadeIn ${
          msg.type === 'error'
            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        }`}>
          {msg.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{msg.type === 'error' ? 'Lỗi thao tác' : 'Thông báo'}</p>
            <p className="text-xs mt-0.5 leading-relaxed">{msg.text}</p>
          </div>
        </div>
      )}

      {/* Grid: Create Box & Server Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Create Mailbox (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tạo Hộp Thư Mới (cPanel UAPI)</h2>
              <p className="text-xs text-slate-400">Gọi API Email/add_pop tạo hộp thư chuẩn RFC trên máy chủ cPanel</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Địa chỉ Email muốn tạo <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-indigo-500">
                <input
                  type="text"
                  required
                  placeholder="ví dụ: test01, info, support"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  className="flex-1 px-4 py-2.5 bg-transparent text-sm text-white focus:outline-none font-mono"
                />
                <span className="px-4 py-2.5 text-xs font-semibold text-indigo-400 bg-slate-900 border-l border-slate-800 font-mono">
                  @{targetDomain}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Lưu ý: Chỉ nhập phần trước dấu @ (không gõ cả domain). Hệ thống tự động ghép với @{targetDomain}.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Mật khẩu hộp thư <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tự tạo mật khẩu mạnh</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nhập mật khẩu an toàn (chữ hoa, số, ký tự đặc biệt)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                {newPassword && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newPassword)}
                    title="Sao chép mật khẩu"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dung lượng Quota (MB)
                </label>
                <input
                  type="number"
                  min="250"
                  max="10240"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">1024 MB = 1 GB</p>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Đang tạo qua UAPI...' : 'Tạo Hộp Mail Ngay'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Server Specs Card (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Thông số Mail Server</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400 font-medium">Domain chính:</p>
                <p className="font-mono text-indigo-400 font-semibold text-sm mt-0.5">{targetDomain}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400 font-medium">cPanel User:</p>
                <p className="font-mono text-emerald-400 font-semibold mt-0.5">{config?.user || 'eh8vxynb05pr'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">IMAP (Đọc thư):</span>
                  <span className="text-cyan-400 font-bold">Port 993 (SSL)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">POP3:</span>
                  <span className="text-slate-300">Port 995 (SSL)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SMTP (Gửi thư):</span>
                  <span className="text-amber-400 font-bold">Port 465 (SSL)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
            <span>Trạng thái API Token:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              config?.hasToken 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {config?.hasToken ? 'Đã kích hoạt' : 'Chưa có Token'}
            </span>
          </div>
        </div>

      </div>

      {/* Mailbox List */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Danh sách Hộp Thư Đã Tạo ({mailboxes.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Dữ liệu gọi trực tiếp từ UAPI Email/list_pops</p>
          </div>

          <button
            onClick={loadMailboxes}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới danh sách</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Đang truy vấn UAPI cPanel...</p>
          </div>
        ) : mailboxes.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <Mail className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Chưa có hộp thư nào được tạo</p>
            <p className="text-xs text-slate-500 mt-1">Dùng form phía trên để tạo hộp mail đầu tiên của bạn</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Tài khoản Mail</th>
                  <th className="px-6 py-4">Dung lượng / Quota</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mailboxes.map((item, idx) => {
                  const emailAddress = item.email || item.login;
                  const isMainAccount = item.login === 'Main Account' || item.email === config?.user;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase border border-indigo-500/30">
                            {emailAddress?.[0] || 'M'}
                          </div>
                          <div>
                            <p className="font-semibold text-white font-mono">{emailAddress}</p>
                            {isMainAccount ? (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                Tài khoản cPanel gốc
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Hộp mail POP3/IMAP</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.diskquota ? `${item.diskquota} MB` : 'Không giới hạn'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>Hoạt động</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Nút Đọc mail trực tiếp */}
                          {!isMainAccount && (
                            <button
                              onClick={() => onOpenInbox(emailAddress)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
                            >
                              <Inbox className="w-3.5 h-3.5" />
                              <span>Mở Hộp Thư</span>
                            </button>
                          )}

                          {/* Đổi mật khẩu */}
                          {!isMainAccount && (
                            <button
                              onClick={() => setPassModal({ open: true, email: emailAddress, newPassword: '' })}
                              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                              title="Đổi mật khẩu"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          )}

                          {/* Xóa */}
                          {!isMainAccount && (
                            <button
                              onClick={() => handleDelete(emailAddress)}
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                              title="Xóa hộp mail"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Change Password */}
      {passModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Đổi Mật Khẩu Hộp Mail
              </h3>
              <button
                onClick={() => setPassModal({ open: false, email: '', newPassword: '' })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Đang đổi mật khẩu cho tài khoản: <strong className="text-indigo-400 font-mono">{passModal.email}</strong>
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="text"
                  required
                  placeholder="Gõ mật khẩu mới đủ mạnh..."
                  value={passModal.newPassword}
                  onChange={(e) => setPassModal({ ...passModal, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPassModal({ open: false, email: '', newPassword: '' })}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Xác nhận Đổi Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
