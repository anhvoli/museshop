import React, { useState, useEffect } from 'react';
import api from './services/api';
import MailboxManager from './components/MailboxManager';
import WebmailReader from './components/WebmailReader';
import ComposeMail from './components/ComposeMail';
import ConfigModal from './components/ConfigModal';
import { 
  Mail, 
  Inbox, 
  Send, 
  Settings, 
  ShieldCheck, 
  Server, 
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Key
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('manager'); // 'manager' | 'reader'
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Modals state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [composeModal, setComposeModal] = useState({ open: false, from: '', pass: '' });

  // Prefilled email for Webmail reader
  const [prefilledEmail, setPrefilledEmail] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.getConfig();
      if (res.success) {
        setConfig(res.config);
      }
    } catch (err) {
      console.error('Load config error:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleOpenInbox = (email) => {
    setPrefilledEmail(email);
    setActiveTab('reader');
  };

  const handleOpenCompose = (fromEmail = '', pass = '') => {
    setComposeModal({
      open: true,
      from: fromEmail,
      pass: pass
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navbar */}
      <header className="h-18 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                  cPanel Webmail Suite
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  UAPI + IMAP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {config?.domain || 'nckh.anhvoli.id.vn'} • User: {config?.user || 'eh8vxynb05pr'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'manager'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Quản lý Hộp Thư (UAPI)</span>
            </button>

            <button
              onClick={() => setActiveTab('reader')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reader'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Đọc Thư (IMAP Port 993)</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenCompose()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>Soạn thư</span>
            </button>

            <button
              onClick={() => setConfigModalOpen(true)}
              title="Cấu hình Token cPanel"
              className={`p-2 rounded-xl border transition-colors ${
                config?.hasToken
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'manager' ? (
          <MailboxManager
            config={config}
            onOpenInbox={handleOpenInbox}
          />
        ) : (
          <WebmailReader
            config={config}
            prefilledEmail={prefilledEmail}
            onCompose={handleOpenCompose}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-mono">
          <span>Máy chủ: <strong className="text-slate-300">nckh.anhvoli.id.vn</strong></span>
          <span>•</span>
          <span>IMAP SSL: <strong className="text-cyan-400">993</strong></span>
          <span>•</span>
          <span>SMTP SSL: <strong className="text-amber-400">465</strong></span>
          <span>•</span>
          <span>cPanel UAPI: <strong className="text-indigo-400">2083</strong></span>
        </div>
        <p className="text-[11px] text-slate-600">
          Dự án quản lý và đọc hộp mail tự động theo tài liệu Nghiên cứu Khoa học cPanel UAPI & IMAP Client
        </p>
      </footer>

      {/* Compose Modal */}
      <ComposeMail
        isOpen={composeModal.open}
        onClose={() => setComposeModal({ open: false, from: '', pass: '' })}
        defaultFrom={composeModal.from}
        defaultPassword={composeModal.pass}
      />

      {/* Config Modal */}
      <ConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={config}
        onConfigUpdated={loadConfig}
      />

    </div>
  );
}
