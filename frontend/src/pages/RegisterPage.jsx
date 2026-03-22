import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  AcademicCapIcon, 
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' // Mặc định là Học viên
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth(); // Giả sử Thảo có hàm register trong AuthContext
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Gọi API đăng ký (Thay bằng auth-service của Thảo sau này)
      const response = await register(formData);
      if (response.success) {
        toast.success('Tạo tài khoản thành công!');
        navigate('/login');
      } else {
        toast.error(response.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra trong quá trình đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden bg-slate-950">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-float animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full mx-4"
      >
        <div className="glass-card p-10 border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Tham gia FlexEdu</h2>
            <p className="text-gray-400 mt-2">Bắt đầu hành trình chinh phục tri thức ngay hôm nay</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Họ tên */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Họ và tên</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-glass pl-10"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-glass pl-10"
                  placeholder="thao@example.com"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-glass pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role Selection (Học viên / Giảng viên) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 text-center">Bạn muốn tham gia với vai trò nào?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'STUDENT'})}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    formData.role === 'STUDENT' 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  <UserIcon className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Học viên</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'INSTRUCTOR'})}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    formData.role === 'INSTRUCTOR' 
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  <AcademicCapIcon className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Giảng viên</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center group h-14"
            >
              <span className="text-lg">{loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}</span>
              <ArrowRightIcon className={`w-5 h-5 ml-2 transition-transform duration-300 ${!loading && 'group-hover:translate-x-1'}`} />
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-gray-400">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}