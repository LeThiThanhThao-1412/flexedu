// frontend/src/pages/InstructorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import GradientText from '../components/common/GradientText';
import { PrimaryButton } from '../components/common/Button';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await courseService.getMyCourses({ status: 'ALL' });
      console.log('My courses response:', response);
      
      const coursesData = response.data.courses || [];
      setCourses(coursesData);

      const totalStudents = coursesData.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);
      const totalRevenue = coursesData.reduce((sum, c) => sum + (c.price * (c._count?.enrollments || 0)), 0);
      
      setStats({
        totalCourses: coursesData.length,
        totalStudents,
        totalRevenue,
        completionRate: 0,
      });
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId) => {
    try {
      await courseService.publishCourse(courseId);
      toast.success('Khóa học đã được xuất bản!');
      fetchData();
    } catch (error) {
      toast.error('Xuất bản thất bại');
    }
  };

  const statCards = [
    { icon: AcademicCapIcon, label: 'Khóa học', value: stats.totalCourses, color: 'from-blue-500 to-cyan-500' },
    { icon: UserGroupIcon, label: 'Học viên', value: stats.totalStudents, color: 'from-purple-500 to-pink-500' },
    { icon: CurrencyDollarIcon, label: 'Doanh thu', value: `$${stats.totalRevenue}`, color: 'from-emerald-500 to-teal-500' },
    { icon: ChartBarIcon, label: 'Tỷ lệ hoàn thành', value: `${stats.completionRate}%`, color: 'from-orange-500 to-red-500' },
  ];

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard <GradientText>Giảng viên</GradientText>
            </h1>
            <p className="text-gray-400">Quản lý khóa học và theo dõi hiệu suất giảng dạy</p>
          </div>
          <Link to="/instructor/courses/create">
            <PrimaryButton className="flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Tạo khóa học mới
            </PrimaryButton>
          </Link>
        </div>

        {/* Stats Cards */}
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

        {/* Courses List */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Khóa học của bạn</h2>
          
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Bạn chưa có khóa học nào</p>
              <Link to="/instructor/courses/create">
                <PrimaryButton className="mt-4">Tạo khóa học đầu tiên</PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <div className="flex items-center space-x-4">
                    <img
                      src={course.thumbnail || 'https://via.placeholder.com/60x60'}
                      alt={course.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="text-white font-semibold">{course.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center">
                          <UserGroupIcon className="w-3 h-3 mr-1" />
                          {course._count?.enrollments || 0} học viên
                        </span>
                        <span className="flex items-center">
                          <EyeIcon className="w-3 h-3 mr-1" />
                          {course.views || 0} lượt xem
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          course.status === 'PUBLISHED' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {course.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link to={`/instructor/courses/${course.id}/content`}>
                      <button className="p-2 text-blue-400 hover:text-blue-300 transition" title="Quản lý nội dung">
                        <DocumentTextIcon className="w-5 h-5" />
                      </button>
                    </Link>
                    <Link to={`/instructor/courses/${course.id}/edit`}>
                      <button className="p-2 text-gray-400 hover:text-white transition" title="Chỉnh sửa thông tin">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </Link>
                    {course.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handlePublish(course.id)}
                        className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition text-sm"
                      >
                        Xuất bản
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}