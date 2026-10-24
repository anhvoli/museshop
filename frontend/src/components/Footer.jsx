import React from 'react';
import { Link } from 'react-router-dom';
import { Key, Shield, Zap, Headphones, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* Features banner */}
      <div className="border-b border-slate-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Giao hàng tự động 24/7</h4>
                <p className="text-xs text-slate-400 mt-0.5">Nhận tài khoản và key bản quyền tức thì sau thanh toán</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Bảo hành uy tín</h4>
                <p className="text-xs text-slate-400 mt-0.5">Cam kết 1 đổi 1 hoặc hoàn tiền trong suốt thời gian sử dụng</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Hỗ trợ tận tình</h4>
                <p className="text-xs text-slate-400 mt-0.5">Đội ngũ kỹ thuật túc trực giải đáp và hỗ trợ nhanh chóng</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Key className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">SHOPKEY</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống cung cấp giải pháp tài khoản bản quyền, key game, phần mềm tiện ích và dịch vụ số uy tín hàng đầu.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Sản phẩm</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/?category=tien-ich" className="hover:text-white transition-colors">Tiện ích & Phần mềm</Link></li>
              <li><Link to="/?category=giai-tri" className="hover:text-white transition-colors">Giải trí & Phim ảnh</Link></li>
              <li><Link to="/?category=nghe-nhac" className="hover:text-white transition-colors">Tài khoản Âm nhạc</Link></li>
              <li><Link to="/?category=hoc-tap" className="hover:text-white transition-colors">Công cụ Học tập</Link></li>
              <li><Link to="/?category=tro-choi" className="hover:text-white transition-colors">Game & Bản quyền</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Liên kết nhanh</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/deposit" className="hover:text-white transition-colors">Hướng dẫn nạp tiền</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Tra cứu đơn hàng</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Quản lý tài khoản</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo hành</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Phương thức thanh toán</h5>
            <p className="text-xs text-slate-400 mb-3">
              Chuyển khoản ngân hàng VietQR tự động 24/7, nạp tiền khớp lệnh tức thì không cần chờ đợi.
            </p>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">MBBank</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">Vietcombank</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">VietQR</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SHOPKEY. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with React & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
