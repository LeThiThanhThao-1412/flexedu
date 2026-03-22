// frontend/src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/payment.service';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/common/Button';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  
  // Lấy thông tin từ state (được truyền từ CourseDetailPage)
  const { courseId, courseTitle, courseThumbnail, amount, instructorName } = location.state || {};
  
  // Nếu không có state, redirect về trang chủ
  if (!courseId) {
    navigate('/');
    return null;
  }

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // 1. Tạo order qua payment service
      const orderResponse = await paymentService.createOrder({
        courseId,
        amount,
        currency: 'usd'
      });
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Tạo order thất bại');
      }
      
      const { orderId, clientSecret, paymentIntentId } = orderResponse.data;
      
      // 2. MOCK MODE: Gọi API test-success để mô phỏng thanh toán thành công
      // Trong môi trường thật, bạn sẽ dùng Stripe Elements ở đây
      const confirmResponse = await paymentService.testPaymentSuccess({
        paymentIntentId: paymentIntentId
      });
      
      if (confirmResponse.success) {
        toast.success('Thanh toán thành công! Đang ghi danh khóa học...');
        
        // 3. Gọi enrollment để ghi danh (thực tế webhook sẽ làm, nhưng mock thì gọi trực tiếp)
        await courseService.enrollCourse(courseId);
        
        toast.success('Đăng ký khóa học thành công!');
        
        // 4. Chuyển đến trang học tập
        navigate(`/learning/${courseId}`);
      } else {
        throw new Error(confirmResponse.message || 'Xác nhận thanh toán thất bại');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Thanh toán thất bại, vui lòng thử lại');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to={`/courses/${courseId}`} className="flex items-center text-gray-400 hover:text-white group">
            <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Quay lại khóa học
          </Link>
          <div className="flex items-center text-gray-400 text-sm">
            <LockClosedIcon className="w-4 h-4 mr-1" />
            Thanh toán an toàn
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <CreditCardIcon className="w-6 h-6 mr-2 text-blue-400" />
                  Thông tin thanh toán
                </h2>
                
                {/* User Info */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Người mua</p>
                  <p className="text-white font-medium">{user?.name || 'Khách hàng'}</p>
                  <p className="text-gray-400 text-sm mt-1">{user?.email || 'Chưa có email'}</p>
                </div>
                
                {/* Payment Method (Mock Mode) */}
                <div className="space-y-4">
                  <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                          <CreditCardIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Thanh toán bằng thẻ</p>
                          <p className="text-gray-500 text-xs">MOCK MODE - Thanh toán giả lập</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="visa" className="w-8 h-8" />
                        <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="mastercard" className="w-8 h-8" />
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        ⚡ MOCK MODE: Đây là chế độ thanh toán giả lập. Bấm "Xác nhận thanh toán" để hoàn tất.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <PrimaryButton
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full py-4 text-lg"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : (
                      `Xác nhận thanh toán ${amount} USD`
                    )}
                  </PrimaryButton>
                </div>
              </GlassCard>
            </motion.div>
            
            {/* Security Info */}
            <GlassCard className="p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-400" />
                Thanh toán an toàn
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-400">
                  <LockClosedIcon className="w-4 h-4 mr-2" />
                  Bảo mật thông tin
                </div>
                <div className="flex items-center text-gray-400">
                  <TruckIcon className="w-4 h-4 mr-2" />
                  Hỗ trợ 24/7
                </div>
                <div className="flex items-center text-gray-400">
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Hoàn tiền trong 7 ngày
                </div>
                <div className="flex items-center text-gray-400">
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Bảo vệ người mua
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Order Summary */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-6 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4">Đơn hàng</h3>
                
                <div className="flex gap-4 mb-4 pb-4 border-b border-white/10">
                  <img
                    src={courseThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'}
                    alt={courseTitle}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-white font-medium line-clamp-2">{courseTitle}</p>
                    <p className="text-gray-400 text-sm mt-1">{instructorName}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Giá khóa học</span>
                    <span>{amount} USD</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Phí nền tảng</span>
                    <span>0 USD</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Giảm giá</span>
                    <span>0 USD</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-blue-400">{amount} USD</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}