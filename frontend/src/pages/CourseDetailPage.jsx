// frontend/src/pages/CourseDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import GradientText from '../components/common/GradientText';
import { PrimaryButton, SecondaryButton } from '../components/common/Button';
import toast from 'react-hot-toast';
import { 
  PlayCircleIcon, 
  ClockIcon, 
  UserGroupIcon, 
  StarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await courseService.getCourseById(id);
      setCourse(response.data);
      setIsEnrolled(response.data.isEnrolled || false);
      if (response.data.modules?.length > 0) {
        setActiveModule(response.data.modules[0]);
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Không thể tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi bấm "Bắt đầu học ngay" - Chuyển đến thanh toán
  const handleStartLearning = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng ký khóa học');
      navigate('/login');
      return;
    }

    // Nếu khóa học miễn phí, enroll trực tiếp không qua thanh toán
    if (course.price === 0) {
      handleFreeEnroll();
      return;
    }

    // Chuyển đến trang thanh toán với thông tin khóa học
    navigate('/checkout', {
      state: {
        courseId: course.id,
        courseTitle: course.title,
        courseThumbnail: course.thumbnail,
        amount: course.price,
        instructorName: course.instructor?.name || 'Giảng viên'
      }
    });
  };

  // Xử lý đăng ký khóa học miễn phí
  const handleFreeEnroll = async () => {
    setEnrolling(true);
    try {
      await courseService.enrollCourse(id);
      toast.success('Đăng ký khóa học thành công!');
      setIsEnrolled(true);
      // Sau khi đăng ký thành công, chuyển đến trang học
      navigate(`/learning/${course.id}`);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Bạn đã đăng ký khóa học này rồi');
      } else {
        toast.error('Đăng ký thất bại, vui lòng thử lại');
      }
    } finally {
      setEnrolling(false);
    }
  };

  // Xử lý khi đã học (chuyển đến trang học tập)
  const handleGoToLearning = () => {
    navigate(`/learning/${course.id}`);
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-white">Không tìm thấy khóa học</div>
      </div>
    );
  }

  const levelMap = {
    BEGINNER: { label: 'Cơ bản', color: 'bg-emerald-500/20 text-emerald-400' },
    INTERMEDIATE: { label: 'Trung cấp', color: 'bg-amber-500/20 text-amber-400' },
    ADVANCED: { label: 'Nâng cao', color: 'bg-rose-500/20 text-rose-400' },
  };

  const levelStyle = levelMap[course.level] || levelMap.BEGINNER;

  // Tính tổng thời lượng
  const totalDuration = course.modules?.reduce((acc, m) => 
    acc + (m.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0), 0) || 0;
  
  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200'}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <Link to="/courses" className="inline-flex items-center text-gray-300 hover:text-white mb-4 group">
              <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Quay lại danh sách
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>
            <div className="flex flex-wrap gap-4 items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${levelStyle.color}`}>
                {levelStyle.label}
              </span>
              <div className="flex items-center text-gray-300">
                <UserGroupIcon className="w-4 h-4 mr-1" />
                <span>{course._count?.enrollments || 0} học viên</span>
              </div>
              <div className="flex items-center text-gray-300">
                <StarIcon className="w-4 h-4 mr-1 text-yellow-500" />
                <span>{course.rating || 0} đánh giá</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Giới thiệu khóa học</h2>
              <p className="text-gray-300 leading-relaxed">{course.description}</p>
            </GlassCard>

            {/* Curriculum */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Nội dung khóa học</h2>
              <div className="space-y-4">
                {course.modules?.map((module, idx) => (
                  <div key={module.id} className="border-b border-white/10 pb-4 last:border-0">
                    <button
                      onClick={() => setActiveModule(activeModule?.id === module.id ? null : module)}
                      className="w-full flex justify-between items-center text-left"
                    >
                      <div>
                        <span className="text-blue-400 font-medium">Chương {idx + 1}</span>
                        <h3 className="text-white font-semibold">{module.title}</h3>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {module.lessons?.length || 0} bài học
                      </span>
                    </button>
                    {activeModule?.id === module.id && (
                      <div className="mt-3 ml-4 space-y-2">
                        {module.lessons?.map((lesson, lessonIdx) => (
                          <Link
                            key={lesson.id}
                            to={`/lessons/${lesson.id}`}
                            className="flex items-center justify-between py-2 hover:bg-white/5 rounded-lg px-2 transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              {lesson.isFree ? (
                                <PlayCircleIcon className="w-4 h-4 text-green-400" />
                              ) : (
                                <PlayCircleIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-gray-300 group-hover:text-white transition-colors">
                                Bài {lessonIdx + 1}: {lesson.title}
                              </span>
                              {lesson.isFree && (
                                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                                  Miễn phí
                                </span>
                              )}
                            </div>
                            {lesson.duration && (
                              <span className="text-xs text-gray-500">{lesson.duration} phút</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  {course.price === 0 ? 'Miễn phí' : `${course.price} USD`}
                </div>
                {isEnrolled ? (
                  <PrimaryButton onClick={handleGoToLearning} className="w-full">
                    <PlayCircleIcon className="w-5 h-5 mr-2 inline" />
                    Bắt đầu học ngay
                  </PrimaryButton>
                ) : (
                  <PrimaryButton 
                    onClick={handleStartLearning} 
                    disabled={enrolling}
                    className="w-full"
                  >
                    {enrolling ? (
                      'Đang xử lý...'
                    ) : course.price === 0 ? (
                      'Đăng ký ngay'
                    ) : (
                      <>
                        <CreditCardIcon className="w-5 h-5 mr-2 inline" />
                        Thanh toán ngay
                      </>
                    )}
                  </PrimaryButton>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Thời lượng</span>
                  <span>~{totalDuration} phút</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Bài học</span>
                  <span>{totalLessons} bài</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Chương</span>
                  <span>{course.modules?.length || 0} chương</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Trình độ</span>
                  <span>{levelStyle.label}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}