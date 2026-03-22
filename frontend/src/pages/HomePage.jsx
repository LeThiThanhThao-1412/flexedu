// frontend/src/pages/HomePage.jsx - Cập nhật Hero Section
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import GradientText from '../components/common/GradientText';
import { PrimaryButton, SecondaryButton } from '../components/common/Button';

// Thêm import này nếu chưa có
import { SparklesIcon, RocketLaunchIcon, AcademicCapIcon, ChartBarIcon, ArrowPathIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getCourses({ limit: 3 });
        setFeaturedCourses(response.data.courses || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const features = [
    { icon: SparklesIcon, title: 'Công nghệ tiên tiến', desc: 'Học tập với nền tảng hiện đại, tối ưu trải nghiệm' },
    { icon: RocketLaunchIcon, title: 'Tốc độ vượt trội', desc: 'Hệ thống chịu tải 10,000+ người dùng đồng thời' },
    { icon: AcademicCapIcon, title: 'Giảng viên hàng đầu', desc: 'Đội ngũ chuyên gia giàu kinh nghiệm thực tế' },
    { icon: ChartBarIcon, title: 'Theo dõi tiến độ', desc: 'Báo cáo chi tiết, cá nhân hóa lộ trình học' },
  ];

  return (
    <div className="pt-16">
      {/* Hero Section with Animated Background */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Bubbles */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-6">
              <SparklesIcon className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm text-gray-300">FlexEdu 2.0 | Công nghệ đột phá</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Học tập <GradientText>không giới hạn</GradientText>
              <br />
              <span className="text-white">với công nghệ AI</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Trải nghiệm nền tảng học tập trực tuyến thế hệ mới với hàng ngàn khóa học chất lượng
              từ các chuyên gia hàng đầu thế giới.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/courses">
                <PrimaryButton className="group">
                  <span>Khám phá ngay</span>
                  <ArrowPathIcon className="w-5 h-5 ml-2 inline-block group-hover:rotate-90 transition-transform duration-300" />
                </PrimaryButton>
              </Link>
              <SecondaryButton className="group flex items-center justify-center">
                <PlayCircleIcon className="w-5 h-5 mr-2" />
                <span>Xem demo</span>
              </SecondaryButton>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {[
              { value: '500+', label: 'Khóa học' },
              { value: '50K+', label: 'Học viên' },
              { value: '200+', label: 'Giảng viên' },
              { value: '99%', label: 'Hài lòng' },
            ].map((stat, idx) => (
              <GlassCard key={idx} className="p-4 text-center card-hover cursor-pointer">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </GlassCard>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tại sao chọn <GradientText>FlexEdu</GradientText>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Nền tảng học tập được thiết kế để mang lại trải nghiệm tốt nhất cho người học
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-6 text-center card-hover cursor-pointer group"
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      <div className="relative py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Khóa học <GradientText>nổi bật</GradientText>
              </h2>
              <p className="text-gray-400">Khám phá những khóa học được yêu thích nhất</p>
            </div>
            <Link to="/courses" className="text-blue-400 hover:text-blue-300 flex items-center group">
              Xem tất cả
              <ArrowPathIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card h-80 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/courses/${course.id}`}>
                    <GlassCard className="overflow-hidden card-hover cursor-pointer">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                        alt={course.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <span className="text-blue-400 font-bold">
                            {course.price === 0 ? 'Miễn phí' : `${course.price} USD`}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-gray-400 text-sm">{course.rating || 0}</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}