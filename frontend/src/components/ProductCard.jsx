import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, ShoppingCart, ArrowRight } from 'lucide-react';

const ProductCard = ({ product }) => {
  // Format price
  const formattedPrice = product.display_price 
    ? `${product.display_price.toLocaleString('vi-VN')} đ` 
    : 'Liên hệ';
    
  const formattedOriginalPrice = product.original_price && product.original_price > product.display_price
    ? `${product.original_price.toLocaleString('vi-VN')} đ`
    : null;

  const discountPercent = product.original_price && product.original_price > product.display_price
    ? Math.round(((product.original_price - product.display_price) / product.original_price) * 100)
    : 0;

  const inStock = product.total_stock > 0;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Thumbnail container */}
        <Link to={`/product/${product.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
            }}
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
            {discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold tracking-wide shadow-sm">
                -{discountPercent}%
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide backdrop-blur-md ${
              inStock 
                ? 'bg-emerald-500/90 text-white' 
                : 'bg-slate-800/90 text-slate-300'
            }`}>
              {inStock ? `Sẵn hàng (${product.total_stock})` : 'Hết hàng'}
            </span>
          </div>
        </Link>

        {/* Content */}
        <div className="p-4">
          {/* Rating and sold */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating || '5.0'}</span>
            </div>
            <span>Đã bán: <strong className="text-slate-600 dark:text-slate-300">{product.sold || 0}</strong></span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>
      </div>

      {/* Footer / Price & Action */}
      <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2">
        <div className="flex items-end justify-between gap-2 pt-3">
          <div>
            <span className="text-[11px] block text-slate-400 font-medium">Chỉ từ</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                {formattedPrice}
              </span>
              {formattedOriginalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>
          </div>

          <Link
            to={`/product/${product.slug}`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200"
            title="Xem chi tiết"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
