import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Layers, 
  X, 
  Check, 
  AlertCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryIds, setFormCategoryIds] = useState([]);
  const [formImage, setFormImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState(1);
  const [formSortOrder, setFormSortOrder] = useState(0);

  // Plans Modal State
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormName, setPlanFormName] = useState('');
  const [planFormDurationType, setPlanFormDurationType] = useState('month');
  const [planFormDurationValue, setPlanFormDurationValue] = useState(1);
  const [planFormPrice, setPlanFormPrice] = useState('');
  const [planFormSalePrice, setPlanFormSalePrice] = useState('');
  const [planFormCostPrice, setPlanFormCostPrice] = useState('');

  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories')
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Fetch admin products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormCategoryIds([]);
    setFormImage('');
    setFormDesc('');
    setFormStatus(1);
    setFormSortOrder(0);
    setProductModalOpen(true);
    setMsg({ text: '', type: '' });
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSlug(prod.slug);
    setFormCategoryIds(prod.category_ids ? prod.category_ids.split(',').map(s => s.trim()) : []);
    setFormImage(prod.image || '');
    setFormDesc(prod.description || '');
    setFormStatus(prod.status);
    setFormSortOrder(prod.sort_order || 0);
    setProductModalOpen(true);
    setMsg({ text: '', type: '' });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setMsg({ text: 'Vui lòng nhập tên sản phẩm', type: 'error' });
      return;
    }

    try {
      const payload = {
        name: formName,
        slug: formSlug,
        category_ids: formCategoryIds.join(','),
        image: formImage,
        description: formDesc,
        status: formStatus,
        sort_order: formSortOrder
      };

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }

      setProductModalOpen(false);
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Lỗi lưu sản phẩm', type: 'error' });
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}" và toàn bộ gói cước liên quan?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  // Open Plans Manager Modal
  const openPlansModal = async (prod) => {
    setActiveProduct(prod);
    setPlansModalOpen(true);
    resetPlanForm();
    try {
      const res = await api.get(`/admin/plans/${prod.id}`);
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
    }
  };

  const resetPlanForm = () => {
    setEditingPlan(null);
    setPlanFormName('');
    setPlanFormDurationType('month');
    setPlanFormDurationValue(1);
    setPlanFormPrice('');
    setPlanFormSalePrice('');
    setPlanFormCostPrice('');
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planFormName || !planFormPrice) {
      alert('Vui lòng nhập tên gói và giá bán');
      return;
    }

    try {
      const payload = {
        product_id: activeProduct.id,
        name: planFormName,
        duration_type: planFormDurationType,
        duration_value: planFormDurationValue,
        price: planFormPrice,
        sale_price: planFormSalePrice || 0,
        cost_price: planFormCostPrice || 0,
        status: 1
      };

      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }

      resetPlanForm();
      // Reload plans
      const res = await api.get(`/admin/plans/${activeProduct.id}`);
      if (res.data.success) setPlans(res.data.plans);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu gói cước');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Bạn có chắc muốn xóa gói này và toàn bộ key trong kho?')) return;
    try {
      await api.delete(`/admin/plans/${planId}`);
      const res = await api.get(`/admin/plans/${activeProduct.id}`);
      if (res.data.success) setPlans(res.data.plans);
      fetchData();
    } catch (err) {
      alert('Lỗi xóa gói');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.slug && p.slug.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Quản lý Sản phẩm & Gói cước
          </h1>
          <p className="text-xs text-slate-400 mt-1">Danh sách sản phẩm tài khoản, phần mềm tiện ích và cấu hình giá</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-950/70 rounded-3xl p-6 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 rounded-l-xl">Sản phẩm</th>
                <th className="p-3">Số gói</th>
                <th className="p-3">Tồn kho</th>
                <th className="p-3">Đã bán</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 rounded-r-xl text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-800 flex-shrink-0"
                      />
                      <div>
                        <span className="font-bold text-white text-sm block">{p.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">/{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openPlansModal(p)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {p.plans_count} gói
                    </button>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      p.in_stock > 0 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {p.in_stock > 0 ? `${p.in_stock} key` : 'Hết hàng'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-400">
                    {p.sold || 0}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      p.status === 1 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.status === 1 ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openPlansModal(p)}
                        className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                        title="Quản lý gói cước"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg.text && (
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs">
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tên sản phẩm (*)</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Tài khoản Netflix Premium 4K"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Đường dẫn Slug (Tùy chọn)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="netflix-premium-4k"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Link Ảnh sản phẩm</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Danh mục thuộc về:</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const isChecked = formCategoryIds.includes(c.id.toString());
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          if (isChecked) {
                            setFormCategoryIds(formCategoryIds.filter(id => id !== c.id.toString()));
                          } else {
                            setFormCategoryIds([...formCategoryIds, c.id.toString()]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mô tả sản phẩm (HTML hỗ trợ)</label>
                <textarea
                  rows={4}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Nhập thông tin giới thiệu, tính năng và bảo hành..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Thứ tự sắp xếp</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Trạng thái</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>Hiển thị bán</option>
                    <option value={0}>Tạm ẩn</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Plans Manager */}
      {plansModalOpen && activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Quản lý Gói cước: {activeProduct.name}
                </h3>
                <p className="text-xs text-slate-400">Thêm hoặc điều chỉnh giá các gói thời hạn (1 tháng, 1 năm, vĩnh viễn)</p>
              </div>
              <button
                onClick={() => setPlansModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Plans Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Các gói hiện có ({plans.length})</h4>
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Tên gói</th>
                      <th className="p-3">Thời hạn</th>
                      <th className="p-3">Giá bán</th>
                      <th className="p-3">Giá KM</th>
                      <th className="p-3">Kho</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {plans.map((pl) => (
                      <tr key={pl.id} className="hover:bg-slate-950/50">
                        <td className="p-3 font-semibold text-white">{pl.name}</td>
                        <td className="p-3 capitalize">{pl.duration_value} {pl.duration_type}</td>
                        <td className="p-3 font-bold text-indigo-400">{pl.price.toLocaleString('vi-VN')} đ</td>
                        <td className="p-3 text-emerald-400">{pl.sale_price > 0 ? `${pl.sale_price.toLocaleString('vi-VN')} đ` : '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pl.in_stock > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {pl.in_stock}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingPlan(pl);
                                setPlanFormName(pl.name);
                                setPlanFormDurationType(pl.duration_type);
                                setPlanFormDurationValue(pl.duration_value);
                                setPlanFormPrice(pl.price);
                                setPlanFormSalePrice(pl.sale_price || '');
                                setPlanFormCostPrice(pl.cost_price || '');
                              }}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                              title="Sửa gói"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(pl.id)}
                              className="p-1 rounded bg-slate-800 text-rose-400 hover:text-rose-300"
                              title="Xóa gói"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add / Edit Plan Form */}
            <form onSubmit={handleSavePlan} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" />
                {editingPlan ? 'Sửa thông tin gói' : 'Thêm gói cước mới'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tên gói cước (*)</label>
                  <input
                    type="text"
                    required
                    value={planFormName}
                    onChange={(e) => setPlanFormName(e.target.value)}
                    placeholder="Ví dụ: Gói 1 Năm - Nâng cấp Email chính chủ"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Thời hạn</label>
                    <select
                      value={planFormDurationType}
                      onChange={(e) => setPlanFormDurationType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="day">Ngày</option>
                      <option value="month">Tháng</option>
                      <option value="year">Năm</option>
                      <option value="lifetime">Vĩnh viễn</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Số lượng</label>
                    <input
                      type="number"
                      value={planFormDurationValue}
                      onChange={(e) => setPlanFormDurationValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Giá bán niêm yết (*)</label>
                  <input
                    type="number"
                    required
                    value={planFormPrice}
                    onChange={(e) => setPlanFormPrice(e.target.value)}
                    placeholder="Ví dụ: 150000"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Giá khuyến mãi (Nếu có)</label>
                  <input
                    type="number"
                    value={planFormSalePrice}
                    onChange={(e) => setPlanFormSalePrice(e.target.value)}
                    placeholder="Ví dụ: 120000"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {editingPlan && (
                  <button
                    type="button"
                    onClick={resetPlanForm}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  {editingPlan ? 'Cập nhật gói' : 'Thêm gói vào sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
