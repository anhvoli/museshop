import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/ProductCard';
import { 
  Star, 
  ShieldCheck, 
  Zap, 
  ShoppingCart, 
  CreditCard, 
  Check, 
  Clock, 
  Minus, 
  Plus, 
  ChevronRight,
  AlertCircle,
  Package
} from 'lucide-react';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/products/${slug}`);
      if (res.data.success) {
        const prod = res.data.product;
        setProduct(prod);
        if (prod.plans && prod.plans.length > 0) {
          // Select first in-stock plan or first plan
          const inStockPlan = prod.plans.find(p => p.in_stock > 0) || prod.plans[0];
          setSelectedPlan(inStockPlan);
        }
      }
    } catch (err) {
      console.error('Fetch product detail error:', err);
      setErrorMsg('Không tìm thấy sản phẩm yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const next = quantity + delta;
    if (next < 1) return;
    if (selectedPlan && next > selectedPlan.in_stock && selectedPlan.in_stock > 0) return;
    setQuantity(next);
  };

  const handleAddToCart = () => {
    if (!selectedPlan) return;
    addToCart(product, selectedPlan, quantity);
    alert('Đã thêm sản phẩm vào giỏ hàng!');
  };

  const handleInstantBuy = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!selectedPlan) return;

    if (selectedPlan.in_stock < quantity) {
      setErrorMsg(`Kho hiện chỉ còn ${selectedPlan.in_stock} tài khoản/key.`);
      return;
    }

    const unitPrice = selectedPlan.sale_price > 0 ? selectedPlan.sale_price : selectedPlan.price;
    const totalCost = unitPrice * quantity;

    if (user.money < totalCost) {
      setErrorMsg(`Số dư ví không đủ! Cần ${totalCost.toLocaleString('vi-VN')} đ, ví của bạn hiện có ${user.money.toLocaleString('vi-VN')} đ.`);
      return;
    }

    setPurchasing(true);
    setErrorMsg('');

    try {
      const res = await api.post('/orders/checkout', {
        plan_id: selectedPlan.id,
        quantity
      });

      if (res.data.success) {
        updateBalance(user.money - totalCost);
        setSuccessOrder(res.data.order);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xử lý mua hàng');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Không tìm thấy sản phẩm</h2>
        <Link to="/" className="inline-block mt-4 text-indigo-600 font-semibold hover:underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const currentUnitPrice = selectedPlan 
    ? (selectedPlan.sale_price > 0 ? selectedPlan.sale_price : selectedPlan.price) 
    : 0;

  const totalPayment = currentUnitPrice * quantity;

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        {product.categories?.[0] && (
          <>
            <Link to={`/?category_id=${product.categories[0].id}`} className="hover:text-indigo-600 transition-colors">
              {product.categories[0].name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main product box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Left: Image */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700';
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Giao hàng tự động</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Bảo hành trọn thời hạn</span>
            </div>
          </div>
        </div>

        {/* Right: Info & Plan Selector */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating || '5.0'}</span>
              </div>
              <span>•</span>
              <span>Đã bán: <strong className="text-slate-700 dark:text-slate-200">{product.sold || 0}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Giao ngay lập tức</span>
            </div>

            {/* Plans Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Chọn gói sản phẩm / thời hạn:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.plans?.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const planPrice = plan.sale_price > 0 ? plan.sale_price : plan.price;
                  const hasDiscount = plan.sale_price > 0 && plan.price > plan.sale_price;

                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setQuantity(1);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                          {plan.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                            {planPrice.toLocaleString('vi-VN')} đ
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {plan.price.toLocaleString('vi-VN')} đ
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          plan.in_stock > 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {plan.in_stock > 0 ? `Còn ${plan.in_stock}` : 'Hết hàng'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            {selectedPlan && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Số lượng:
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    (Kho: {selectedPlan.in_stock})
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.includes('Số dư') && (
                  <Link to="/deposit" className="underline font-bold ml-2">
                    Nạp tiền ngay
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Action buttons & Total price */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-500">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {totalPayment.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedPlan || selectedPlan.in_stock === 0}
                className="py-3 px-4 rounded-xl border border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingCart className="w-4 h-4" />
                Thêm vào giỏ hàng
              </button>

              <button
                onClick={handleInstantBuy}
                disabled={!selectedPlan || selectedPlan.in_stock === 0 || purchasing}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <CreditCard className="w-4 h-4" />
                {purchasing ? 'Đang xử lý...' : 'Mua ngay với số dư'}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Description / Guide */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Mô tả & Hướng dẫn sử dụng
        </h3>
        <div 
          className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.' }}
        />
      </div>

      {/* Success Order Modal */}
      {successOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Đặt hàng thành công!</h3>
              <p className="text-xs text-slate-500">Mã đơn hàng: <strong className="text-slate-800 dark:text-slate-200">{successOrder.trans_id}</strong></p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Tài khoản / Key bản quyền của bạn:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successOrder.delivery_content);
                    alert('Đã sao chép vào bộ nhớ tạm!');
                  }}
                  className="text-indigo-600 hover:underline text-xs"
                >
                  Sao chép tất cả
                </button>
              </label>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-all border border-slate-200 dark:border-slate-700 select-all max-h-48 overflow-y-auto">
                {successOrder.delivery_content}
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/orders"
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Xem lịch sử đơn
              </Link>
              <button
                onClick={() => {
                  setSuccessOrder(null);
                  fetchProduct();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
              >
                Tiếp tục mua hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related products */}
      {product.related?.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sản phẩm liên quan</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {product.related.map((rel) => (
              <ProductCard key={rel.id} product={{ ...rel, display_price: rel.min_price }} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetail;
