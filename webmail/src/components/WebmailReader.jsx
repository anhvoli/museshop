import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Inbox, 
  Mail, 
  RefreshCw, 
  Lock, 
  Send, 
  User, 
  Clock, 
  FileText, 
  Code, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Eye,
  KeyRound
} from 'lucide-react';

export default function WebmailReader({ config, prefilledEmail, onCompose }) {
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [messages, setMessages] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [viewMode, setViewMode] = useState('html'); // 'html' or 'text'

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const handleLoginAndFetch = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập địa chỉ email đầy đủ và mật khẩu hộp thư.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.getInbox(email.trim(), password, 30);
      if (res.success) {
        setMessages(res.messages || []);
        setIsLoggedIn(true);
        if (res.messages && res.messages.length > 0) {
          setSelectedMsg(res.messages[0]);
        } else {
          setSelectedMsg(null);
        }
      } else {
        setErrorMsg(res.message || 'Không thể đăng nhập hộp thư.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối IMAP');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (isLoggedIn) {
      handleLoginAndFetch();
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // If not logged into a mailbox, show login credentials card
  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
              <Inbox className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Đăng Nhập Hộp Thư Trực Tuyến (IMAP)</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Đọc thư trực tiếp qua giao thức IMAP SSL Port 993 từ máy chủ {config?.imapHost || 'nckh.anhvoli.id.vn'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginAndFetch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Địa chỉ Email đầy đủ
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder={`ví dụ: test01@${config?.domain || 'nckh.anhvoli.id.vn'}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mật khẩu hộp thư
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Mật khẩu bạn đặt lúc tạo hộp mail"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Lưu ý: Đây là mật khẩu của hộp mail, không phải mật khẩu cPanel hay API token.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Đang kết nối IMAP...' : 'Đăng Nhập & Đọc Hộp Thư'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Logged-in full webmail view
  return (
    <div className="h-[750px] rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      
      {/* Top Header of Webmail */}
      <div className="h-14 px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm font-mono">{email}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                IMAP Connected
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Hộp thư đến ({messages.length} thư)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Soạn thư */}
          <button
            onClick={() => onCompose(email, password)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Soạn Thư Mới</span>
          </button>

          {/* Làm mới */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Tải lại thư mới"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Đăng xuất hộp thư */}
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setPassword('');
              setMessages([]);
              setSelectedMsg(null);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            Thoát
          </button>
        </div>
      </div>

      {/* Main Mail Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Email List (1/3 width) */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-950/40 flex flex-col">
          <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
            <span>Danh sách thư gần đây</span>
            <span>{messages.length} thư</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading && messages.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Đang quét hòm thư...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center px-4">
                <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Hộp thư đang trống</p>
                <p className="text-[11px] text-slate-500 mt-1">Chưa có thư mới nào gửi tới địa chỉ này.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMsg?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMsg(msg)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs truncate ${!msg.seen ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                        {msg.from}
                      </span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {formatDate(msg.date)}
                      </span>
                    </div>

                    <p className={`text-xs truncate mb-1 ${!msg.seen ? 'font-semibold text-indigo-300' : 'text-slate-200'}`}>
                      {msg.subject || '(Không có tiêu đề)'}
                    </p>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {msg.snippet}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Email Content View (2/3 width) */}
        <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden">
          {selectedMsg ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Email Header Bar */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/40 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {selectedMsg.subject || '(Không có tiêu đề)'}
                  </h3>

                  {/* Mode switcher (HTML / Text) */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setViewMode('html')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        viewMode === 'html'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => setViewMode('text')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        viewMode === 'text'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Văn bản
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-500">Từ:</span> <strong className="text-slate-200 font-mono">{selectedMsg.from}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Đến:</span> <span className="text-slate-300 font-mono">{selectedMsg.to || email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(selectedMsg.date)}</span>
                  </div>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                {viewMode === 'html' && selectedMsg.bodyHtml ? (
                  <div className="w-full h-full min-h-[450px] bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-700">
                    <iframe
                      title="Email Content"
                      srcDoc={selectedMsg.bodyHtml}
                      sandbox="allow-same-origin"
                      className="w-full h-full min-h-[450px] border-none"
                    />
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {selectedMsg.bodyText || selectedMsg.bodyHtml || 'Nội dung thư trống.'}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Mail className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-400">Chọn một thư từ danh sách bên trái để đọc</p>
              <p className="text-xs text-slate-600 mt-1">Hoặc dùng nút "Soạn thư mới" để gửi email thử nghiệm</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
