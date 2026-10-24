import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingCart, 
  ArrowRight, 
  Wallet, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user, updateBalance } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrders, setSuccessOrders] = useState([]);

  const isBalanceSufficient = user && user.money >= totalAmount;

  const handleCheckoutAll = async () => {
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (!isBalanceSufficient) {
      setErrorMsg(`Số dư ví (${user.money.toLocaleString('vi-VN')} đ) không đủ để thanh toán ${totalAmount.toLocaleString('vi-VN')} đ.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const completed = [];
    let currentMoney = user.money;

    try {
      for (const item of items) {
        const res = await api.post('/orders/checkout', {
          plan_id: item.plan.id,
          quantity: item.quantity
        });

        if (res.data.success) {
          completed.push(res.data.order);
          currentMoney -= (item.plan.unitPrice * item.quantity);
        }
      }

      updateBalance(currentMoney);
      clearCart();
      setSuccessOrders(completed);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình thanh toán giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  if (successOrders.length > 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thanh toán giỏ hàng thành công!</h2>
          <p className="text-xs text-slate-500">Đã hoàn tất mua {successOrders.length} sản phẩm và xuất mã tự động.</p>
        </div>

        <div className="space-y-4">
          {successOrders.map((ord, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100">{ord.product_name} - {ord.plan_name}</span>
                <span className="text-slate-400">Mã: {ord.trans_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs select-all whitespace-pre-wrap break-all">
                {ord.delivery_content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link
            to="/orders"
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs text-center hover:bg-indigo-700 transition-colors"
          >
            Xem lịch sử đơn hàng
          </Link>
          <Link
            to="/"
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Tiếp tục mua hàng
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-xl mx-auto space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Giỏ hàng đang trống</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Hãy khám phá các sản phẩm tài khoản, phần mềm tiện ích và thêm vào giỏ hàng ngay nhé!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
        >
          <span>Khám phá sản phẩm</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-indigo-600" />
          Giỏ hàng của bạn ({items.length})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Xóa toàn bộ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Items list */}
        <div className="lg:col-span-8 space-y-3">
          {items.map((item) => (
            <div
              key={item.plan.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.product.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                />
                <div>
                  <Link to={`/product/${item.product.slug}`} className="font-bold text-slate-800 dark:text-slate-100 text-sm hover:text-indigo-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{item.plan.name}</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {item.plan.unitPrice.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => updateQuantity(item.plan.id, item.quantity - 1)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Minus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.plan.id, item.quantity + 1)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.plan.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Xóa khỏi giỏ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Tóm tắt đơn hàng</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Số lượng sản phẩm:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Tổng thanh toán:</span>
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {/* Wallet Balance Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Số dư ví của bạn:
                </span>
                <span className="font-bold text-emerald-600">
                  {user ? `${user.money.toLocaleString('vi-VN')} đ` : 'Chưa đăng nhập'}
                </span>
              </div>

              {user && !isBalanceSufficient && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-red-500 font-semibold text-[11px]">Còn thiếu: {(totalAmount - user.money).toLocaleString('vi-VN')} đ</span>
                  <Link to="/deposit" className="text-indigo-600 font-bold hover:underline text-[11px]">
                    Nạp tiền ngay
                  </Link>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleCheckoutAll}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Thanh toán tất cả'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
