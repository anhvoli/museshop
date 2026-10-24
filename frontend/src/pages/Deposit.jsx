import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wallet, 
  QrCode, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  RefreshCw 
} from 'lucide-react';

const Deposit = () => {
  const { user, fetchProfile } = useAuth();
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [amount, setAmount] = useState(50000);
  const [syntax, setSyntax] = useState('');
  const [copiedSyntax, setCopiedSyntax] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDepositInfo();
  }, []);

  const fetchDepositInfo = async () => {
    try {
      const res = await api.get('/wallet/deposit-info');
      if (res.data.success) {
        setBanks(res.data.banks);
        setSyntax(res.data.syntax);
        if (res.data.banks.length > 0) {
          setSelectedBank(res.data.banks[0]);
        }
      }
    } catch (err) {
      console.error('Fetch deposit error:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'syntax') {
      setCopiedSyntax(true);
      setTimeout(() => setCopiedSyntax(false), 2000);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  // Generate VietQR URL
  const qrUrl = selectedBank ? 
    `https://api.vietqr.io/image/${selectedBank.short_name}-${selectedBank.accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(syntax)}&accountName=${encodeURIComponent(selectedBank.accountName)}`
    : '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header & Balance Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 to-purple-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-indigo-800/40">
        <div className="space-y-1">
          <span className="text-xs text-indigo-300 font-semibold tracking-wide uppercase">Tài khoản ví của bạn</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <Wallet className="w-8 h-8 text-amber-400" />
            {user ? `${user.money.toLocaleString('vi-VN')} đ` : '0 đ'}
          </h1>
          <p className="text-xs text-slate-300">Nạp tiền tự động cập nhật số dư sau 1-3 phút</p>
        </div>

        <button
          onClick={handleRefresh}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-2 backdrop-blur-md transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Làm mới số dư</span>
        </button>
      </div>

      {/* Main Deposit Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Left: Settings & Details */}
        <div className="md:col-span-7 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Chọn ngân hàng nạp tiền
          </h2>

          {/* Banks Tabs */}
          <div className="grid grid-cols-2 gap-3">
            {banks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => setSelectedBank(bank)}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  selectedBank?.id === bank.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <img
                  src={bank.image || 'https://api.vietqr.io/img/MB.png'}
                  alt={bank.short_name}
                  className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-slate-100"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{bank.short_name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{bank.accountNumber}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Amount selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Số tiền muốn nạp:
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[20000, 50000, 100000, 200000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    amount === val
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {val.toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Info Breakdown */}
          {selectedBank && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ngân hàng:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedBank.short_name}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedBank.accountName}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{selectedBank.accountNumber}</strong>
                  <button
                    onClick={() => handleCopy(selectedBank.accountNumber, 'account')}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-slate-700">
                <span className="text-slate-400 font-bold">Nội dung chuyển khoản (bắt buộc):</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-mono font-bold">
                    {syntax}
                  </span>
                  <button
                    onClick={() => handleCopy(syntax, 'syntax')}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                  >
                    {copiedSyntax ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-bold">Lưu ý quan trọng:</p>
              <p>Vui lòng chuyển đúng chính xác <strong>Nội dung chuyển khoản</strong> để hệ thống tự động cộng tiền cho tài khoản của bạn.</p>
            </div>
          </div>
        </div>

        {/* Right: VietQR Code */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            <QrCode className="w-4 h-4 text-indigo-600" />
            Quét mã VietQR chuyển khoản
          </div>

          {qrUrl ? (
            <div className="p-3 rounded-2xl bg-white shadow-md border border-slate-200 max-w-[260px]">
              <img
                src={qrUrl}
                alt="VietQR nạp tiền"
                className="w-full h-auto rounded-xl"
              />
            </div>
          ) : (
            <div className="w-56 h-56 rounded-2xl bg-slate-200 animate-pulse"></div>
          )}

          <p className="text-xs text-slate-400 max-w-xs">
            Mở ứng dụng ngân hàng bất kỳ (MBBank, VCB, BIDV, Techcombank, MoMo...) và quét mã để nạp tiền nhanh chóng.
          </p>
        </div>

      </div>

    </div>
  );
};

export default Deposit;
