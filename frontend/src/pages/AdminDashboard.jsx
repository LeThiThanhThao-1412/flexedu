// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import GradientText from '../components/common/GradientText';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeStudents: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy danh sách giảng viên chờ duyệt
      const response = await courseService.getPendingInstructors();
      console.log('Pending instructors:', response.data);
      setPendingInstructors(response.data || []);
      
      // Mock stats (có thể thay bằng API thật sau)
      setStats({
        totalUsers: 1250,
        totalCourses: 48,
        totalRevenue: 12450,
        activeStudents: 890,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (instructorId) => {
    try {
      await courseService.approveInstructor(instructorId);
      toast.success('Đã duyệt giảng viên thành công');
      // Cập nhật lại danh sách
      setPendingInstructors(pendingInstructors.filter(i => i.id !== instructorId));
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Duyệt giảng viên thất bại');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const statCards = [
    { icon: UsersIcon, label: 'Tổng người dùng', value: stats.totalUsers, color: 'from-blue-500 to-cyan-500' },
    { icon: AcademicCapIcon, label: 'Tổng khóa học', value: stats.totalCourses, color: 'from-purple-500 to-pink-500' },
    { icon: CurrencyDollarIcon, label: 'Doanh thu', value: `$${stats.totalRevenue}`, color: 'from-emerald-500 to-teal-500' },
    { icon: ChartBarIcon, label: 'Học viên đang học', value: stats.activeStudents, color: 'from-orange-500 to-red-500' },
  ];

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard <GradientText>Quản trị</GradientText>
          </h1>
          <p className="text-gray-400">Quản lý hệ thống, người dùng và khóa học</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('instructors')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'instructors'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Duyệt giảng viên
            {pendingInstructors.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {pendingInstructors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'courses'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Quản lý khóa học
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Quản lý người dùng
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <GlassCard className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>

            {/* Pending Instructors Summary */}
            {pendingInstructors.length > 0 && (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Giảng viên chờ duyệt</h2>
                  <button
                    onClick={() => setActiveTab('instructors')}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingInstructors.slice(0, 3).map((instructor) => (
                    <div key={instructor.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{instructor.name}</p>
                        <p className="text-gray-400 text-sm">{instructor.email}</p>
                      </div>
                      <button
                        onClick={() => handleApprove(instructor.id)}
                        className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition text-sm"
                      >
                        Duyệt
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* Instructors Tab - Pending Approval */}
        {activeTab === 'instructors' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Giảng viên chờ duyệt
              {pendingInstructors.length > 0 && (
                <span className="ml-2 text-sm text-gray-400">({pendingInstructors.length})</span>
              )}
            </h2>
            
            {pendingInstructors.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Không có giảng viên nào chờ duyệt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInstructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {instructor.name?.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{instructor.name}</h3>
                        <p className="text-gray-400 text-sm">{instructor.email}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          Đăng ký: {formatDate(instructor.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApprove(instructor.id)}
                        className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition flex items-center"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Duyệt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Courses Tab - Placeholder */}
        {activeTab === 'courses' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quản lý khóa học</h2>
            <p className="text-gray-400 text-center py-8">Tính năng đang phát triển</p>
          </GlassCard>
        )}

        {/* Users Tab - Placeholder */}
        {activeTab === 'users' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quản lý người dùng</h2>
            <p className="text-gray-400 text-center py-8">Tính năng đang phát triển</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}