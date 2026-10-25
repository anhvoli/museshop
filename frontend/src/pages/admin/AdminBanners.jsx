import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Sliders,
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';

const POSITIONS = [
  { value: 'below_sliders', label: 'Dưới thanh trượt (Below Sliders)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'home_top', label: 'Đầu trang chủ (Home Top)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'sidebar_left', label: 'Cột bên trái (Sidebar Left)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'sidebar_right', label: 'Cột bên phải (Sidebar Right)', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { value: 'popup', label: 'Cửa sổ nổi (Popup)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
];

const SAMPLE_IMAGES = [
  { label: 'Banner 1 (Mặc định)', path: 'assets/storage/images/banner_KGYQOP.png' },
  { label: 'Banner 2', path: 'assets/storage/images/banner_B9AUW3.png' },
  { label: 'Banner 3', path: 'assets/storage/images/banner_WORP1J.png' },
  { label: 'Banner 4', path: 'assets/storage/images/banner_J3XGI7.png' },
  { label: 'Banner 5', path: 'assets/storage/images/banner_I04GB1.png' },
  { label: 'Banner 6', path: 'assets/storage/images/banner_JC6M5K.png' },
];

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPosition, setFilterPosition] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [position, setPosition] = useState('below_sliders');
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState(1);

  // Alert message
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      if (res.data.success) {
        setBanners(res.data.banners);
      }
    } catch (err) {
      console.error('Fetch banners error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setImage('assets/storage/images/banner_KGYQOP.png');
    setLink('');
    setPosition('below_sliders');
    setSortOrder(0);
    setStatus(1);
    setMsg({ text: '', type: '' });
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBanner(b);
    setTitle(b.title || '');
    setImage(b.image || '');
    setLink(b.link || '');
    setPosition(b.position || 'below_sliders');
    setSortOrder(b.sort_order || 0);
    setStatus(b.status !== undefined ? b.status : 1);
    setMsg({ text: '', type: '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!image.trim()) {
      setMsg({ text: 'Vui lòng cung cấp đường dẫn hình ảnh', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const payload = {
        title: title.trim(),
        image: image.trim(),
        link: link.trim(),
        position,
        sort_order: Number(sortOrder) || 0,
        status: Number(status) === 1 ? 1 : 0
      };

      if (editingBanner) {
        await api.put(`/admin/banners/${editingBanner.id}`, payload);
      } else {
        await api.post('/admin/banners', payload);
      }

      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      setMsg({ 
        text: err.response?.data?.message || 'Có lỗi xảy ra khi lưu banner', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      await api.put(`/admin/banners/${banner.id}/status`);
      setBanners(prev => prev.map(b => 
        b.id === banner.id ? { ...b, status: b.status === 1 ? 0 : 1 } : b
      ));
    } catch (err) {
      alert('Không thể thay đổi trạng thái banner');
    }
  };

  const handleDelete = async (id, bannerTitle) => {
    const label = bannerTitle || `Banner #${id}`;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${label}"?`)) return;

    try {
      await api.delete(`/admin/banners/${id}`);
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa banner');
    }
  };

  const getPositionInfo = (pos) => {
    return POSITIONS.find(p => p.value === pos) || {
      label: pos,
      color: 'bg-slate-700 text-slate-300 border-slate-600'
    };
  };

  const filteredBanners = banners.filter(b => {
    if (filterPosition !== 'all' && b.position !== filterPosition) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (b.title || '').toLowerCase().includes(q);
      const matchLink = (b.link || '').toLowerCase().includes(q);
      return matchTitle || matchLink;
    }
    return true;
  });

  const activeCount = banners.filter(b => b.status === 1).length;
  const inactiveCount = banners.length - activeCount;

  // Resolve image preview src
  const formatImageSrc = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/')) return src;
    return `/${src}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            Quản lý Banner Quảng cáo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập banner quảng cáo, sự kiện khuyến mãi hiển thị tại các vị trí trên website
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Banner Mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng Banner</p>
            <h3 className="text-2xl font-bold text-white mt-1">{banners.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Đang Hiển Thị</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Đang Ẩn</p>
            <h3 className="text-2xl font-bold text-slate-400 mt-1">{inactiveCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-700/40 border border-slate-600/40 text-slate-400 flex items-center justify-center">
            <EyeOff className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề hoặc link liên kết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" /> Vị trí:
          </span>
          <button
            onClick={() => setFilterPosition('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterPosition === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Tất cả ({banners.length})
          </button>
          {POSITIONS.map(pos => {
            const count = banners.filter(b => b.position === pos.value).length;
            return (
              <button
                key={pos.value}
                onClick={() => setFilterPosition(pos.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterPosition === pos.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {pos.label.split('(')[0].trim()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner List / Table */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Đang tải danh sách banner...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="py-16 text-center">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">Không tìm thấy banner nào</p>
            <p className="text-xs text-slate-500 mt-1">Hãy thêm banner mới để làm sinh động trang web của bạn</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-6 py-4">Hình ảnh</th>
                  <th className="px-6 py-4">Tiêu đề & Liên kết</th>
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4 text-center">Thứ tự</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filteredBanners.map((b) => {
                  const posInfo = getPositionInfo(b.position);
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative group w-32 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shadow-sm flex items-center justify-center">
                          <img
                            src={formatImageSrc(b.image)}
                            alt={b.title || 'Banner'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/600x300/1e293b/94a3b8?text=Banner+Image';
                            }}
                          />
                        </div>
                      </td>

                      {/* Title & Link */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-semibold text-white truncate">
                          {b.title || <span className="text-slate-500 italic font-normal">(Không có tiêu đề)</span>}
                        </p>
                        {b.link ? (
                          <a
                            href={b.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline mt-1 truncate max-w-full"
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{b.link}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500 mt-1 block">Không có liên kết</span>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Ảnh: {b.image}
                        </p>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${posInfo.color}`}>
                          {posInfo.label.split('(')[0].trim()}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono font-medium text-slate-300">
                          {b.sort_order}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(b)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            b.status === 1
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-700/40 text-slate-400 border border-slate-600/30 hover:bg-slate-700/60'
                          }`}
                        >
                          {b.status === 1 ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Hiển thị</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Đã ẩn</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                            title="Chỉnh sửa banner"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.title)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                            title="Xóa banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-white">
                  {editingBanner ? `Chỉnh sửa Banner #${editingBanner.id}` : 'Thêm Banner Quảng cáo Mới'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {msg.text && (
                <div className={`p-3.5 rounded-xl text-sm flex items-center gap-2 ${
                  msg.type === 'error' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {msg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tiêu đề Banner <span className="text-slate-500 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Giảm giá hè 50% tài khoản Youtube..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Image URL / Path */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Đường dẫn hình ảnh <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="assets/storage/images/banner_KGYQOP.png hoặc https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />

                {/* Sample Image Quick Selector */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-slate-500">Mẫu có sẵn:</span>
                  {SAMPLE_IMAGES.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(s.path)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Xem trước hình ảnh (Preview)
                </label>
                <div className="w-full h-32 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                  {image ? (
                    <img
                      src={formatImageSrc(image)}
                      alt="Banner Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x200/1e293b/ef4444?text=H%C3%ACnh+%E1%BA%A3nh+kh%C3%B4ng+h%E1%BB%A3p+l%E1%BB%87';
                      }}
                    />
                  ) : (
                    <div className="text-xs text-slate-600 flex flex-col items-center gap-1">
                      <ImageIcon className="w-6 h-6" />
                      <span>Nhập đường dẫn ảnh để xem trước</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Liên kết khi nhấp chuột (URL) <span className="text-slate-500 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://... hoặc /product/slug hoặc để trống"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Grid: Position, Sort Order, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Vị trí hiển thị
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {POSITIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Số lớn hiển thị trước</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>Bật hiển thị</option>
                    <option value={0}>Tạm ẩn</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  {submitting ? 'Đang lưu...' : editingBanner ? 'Lưu thay đổi' : 'Tạo banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminBanners;
