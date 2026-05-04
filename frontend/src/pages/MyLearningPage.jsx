// frontend/src/pages/MyLearningPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import GradientText from '../components/common/GradientText';
import toast from 'react-hot-toast';
import { 
  BookOpenIcon, 
  PlayCircleIcon, 
  CheckCircleIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const location = useLocation();

  const fetchMyCourses = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await courseService.getMyEnrollments();
      console.log('📥 My enrollments API response:', response);
      
      if (response.success) {
        // response.data là object { enrollments: [], pagination: {} }
        const enrollmentsData = response.data?.enrollments || [];
        
        // Log progress để debug
        enrollmentsData.forEach(en => {
          console.log(`📊 Course: ${en.course?.title || en.courseId}, Progress: ${en.progress}%`);
        });
        
        setEnrollments(enrollmentsData);
      } else {
        console.error('API returned success=false:', response);
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Failed to fetch my courses:', error);
      toast.error('Không thể tải danh sách khóa học');
      setEnrollments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  // Refresh khi trang được focus lại (quay từ LearningPage về)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Page focused, refreshing data...');
      fetchMyCourses();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchMyCourses]);

  // Refresh khi navigate đến trang này
  useEffect(() => {
    fetchMyCourses();
  }, [location.key, fetchMyCourses]);

  // Filter courses
  const filteredEnrollments = enrollments.filter(enrollment => {
    const course = enrollment.course || {};
    const courseTitle = (course.title || '').toLowerCase();
    const matchesSearch = courseTitle.includes(searchTerm.toLowerCase());
    
    const progress = enrollment.progress || 0;
    if (filter === 'in-progress') return matchesSearch && progress > 0 && progress < 100;
    if (filter === 'completed') return matchesSearch && progress === 100;
    return matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: enrollments.length,
    inProgress: enrollments.filter(e => (e.progress || 0) > 0 && (e.progress || 0) < 100).length,
    completed: enrollments.filter(e => (e.progress || 0) === 100).length,
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Đang tải khóa học của bạn...</p>
        </div>
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
              Khóa học của <GradientText>tôi</GradientText>
            </h1>
            <p className="text-gray-400">Tiếp tục học tập và nâng cao kỹ năng của bạn</p>
          </div>
          <button
            onClick={fetchMyCourses}
            disabled={refreshing}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
            title="Làm mới"
          >
            <ArrowPathIcon className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Cards */}
        {enrollments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <GlassCard className="p-4 text-center">
              <BookOpenIcon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Khóa học</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <PlayCircleIcon className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
              <div className="text-xs text-gray-400">Đang học</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <CheckCircleIcon className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.completed}</div>
              <div className="text-xs text-gray-400">Hoàn thành</div>
            </GlassCard>
          </div>
        )}

        {/* Search and Filter */}
        {enrollments.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={`px-4 py-2 rounded-lg transition ${filter === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
              >
                Đang học
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg transition ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
              >
                Hoàn thành
              </button>
            </div>
          </div>
        )}

        {/* Course List */}
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-16">
            <AcademicCapIcon className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {enrollments.length === 0 ? 'Chưa có khóa học nào' : 'Không tìm thấy khóa học'}
            </h3>
            <p className="text-gray-400 mb-6">
              {enrollments.length === 0 
                ? 'Bạn chưa đăng ký khóa học nào. Hãy khám phá ngay!' 
                : 'Thử tìm kiếm với từ khóa khác'}
            </p>
            <Link to="/courses" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:scale-105 transition inline-block">
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnrollments.map((enrollment, idx) => {
              const course = enrollment.course || {};
              const progress = enrollment.progress || 0;
              const isCompleted = progress === 100;
              const courseId = course.id || enrollment.courseId;
              
              return (
                <motion.div
                  key={enrollment.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard className="p-5 hover:border-white/30 transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Thumbnail */}
                      <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200'}
                          alt={course.title || 'Khóa học'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Course Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h2 className="text-xl font-bold text-white mb-1 hover:text-blue-400 transition">
                              <Link to={`/learning/${courseId}`}>
                                {course.title || 'Khóa học'}
                              </Link>
                            </h2>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                              {course.description || 'Đang cập nhật...'}
                            </p>
                          </div>
                          {isCompleted && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-1">
                              <CheckCircleIcon className="w-4 h-4" />
                              Đã hoàn thành
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Tiến độ</span>
                            <span className="text-blue-400 font-medium">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex items-center">
                        <Link to={`/learning/${courseId}`}>
                          <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 whitespace-nowrap">
                            {isCompleted ? (
                              <>
                                <CheckCircleIcon className="w-5 h-5" />
                                Xem lại
                              </>
                            ) : progress > 0 ? (
                              <>
                                <PlayCircleIcon className="w-5 h-5" />
                                Tiếp tục học ({Math.round(progress)}%)
                              </>
                            ) : (
                              <>
                                <PlayCircleIcon className="w-5 h-5" />
                                Bắt đầu học
                              </>
                            )}
                          </button>
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}