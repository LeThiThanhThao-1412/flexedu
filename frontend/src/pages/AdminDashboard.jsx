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
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pending instructors
      const instructorsResponse = await courseService.getPendingInstructors();
      setPendingInstructors(instructorsResponse.data || []);
      
      // Fetch stats (will implement with real APIs later)
      // For now, using mock data
      setStats({
        totalUsers: 1250,
        totalCourses: 48,
        totalRevenue: 12450,
        activeStudents: 890,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInstructor = async (instructorId) => {
    try {
      await courseService.approveInstructor(instructorId);
      toast.success('Đã duyệt giảng viên thành công');
      setPendingInstructors(pendingInstructors.filter(i => i.id !== instructorId));
    } catch (error) {
      toast.error('Duyệt giảng viên thất bại');
    }
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
          {['overview', 'instructors', 'courses', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'overview' && 'Tổng quan'}
              {tab === 'instructors' && 'Duyệt giảng viên'}
              {tab === 'courses' && 'Quản lý khóa học'}
              {tab === 'users' && 'Quản lý người dùng'}
            </button>
          ))}
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

            {/* Recent Activity */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Hoạt động gần đây</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-white text-sm">Nguyễn Văn A đã đăng ký khóa học "React Masterclass"</p>
                        <p className="text-gray-500 text-xs">{i + 1} giờ trước</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {/* Instructors Tab - Pending Approval */}
        {activeTab === 'instructors' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Giảng viên chờ duyệt</h2>
            
            {pendingInstructors.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Không có giảng viên nào chờ duyệt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInstructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {instructor.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{instructor.name}</h3>
                        <p className="text-gray-400 text-sm">{instructor.email}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Đăng ký: {new Date(instructor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveInstructor(instructor.id)}
                        className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition flex items-center"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Duyệt
                      </button>
                      <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition flex items-center">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quản lý khóa học</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white">Khóa học {i + 1}</p>
                    <p className="text-gray-500 text-sm">Giảng viên: Nguyễn Văn A</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                      Đã xuất bản
                    </span>
                    <button className="text-blue-400 hover:text-blue-300">Chi tiết</button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quản lý người dùng</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                      <span className="text-white">U</span>
                    </div>
                    <div>
                      <p className="text-white">User {i + 1}</p>
                      <p className="text-gray-500 text-sm">user{i + 1}@example.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      i % 2 === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {i % 2 === 0 ? 'Học viên' : 'Giảng viên'}
                    </span>
                    <button className="text-red-400 hover:text-red-300">Khóa</button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}