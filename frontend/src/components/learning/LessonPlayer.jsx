// frontend/src/components/learning/LessonPlayer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import GlassCard from '../common/GlassCard';
import { PrimaryButton } from '../common/Button';
import toast from 'react-hot-toast';
import { 
  LockClosedIcon, 
  AcademicCapIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';

// Helper xử lý YouTube URL
const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('/').pop()?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export default function LessonPlayer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/lessons/${lessonId}`);
      setLesson(response.data.data);
      setCourseInfo(response.data.data?.module?.course);
      setError(null);
    } catch (err) {
      console.error('❌ Fetch lesson error:', err);
      if (err.response?.status === 403) {
        setError('Bạn cần đăng ký khóa học để xem bài học này');
        if (err.response.data?.courseInfo) {
          setCourseInfo(err.response.data.courseInfo);
        }
      } else {
        setError(err.response?.data?.message || 'Không thể tải bài học');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCheckout = () => {
    const course = courseInfo || lesson?.module?.course;
    
    if (!course || !course.id) {
      toast.error('Không tìm thấy thông tin khóa học');
      return;
    }
    
    navigate('/checkout', {
      state: {
        courseId: course.id,
        courseTitle: course.title,
        courseThumbnail: course.thumbnail,
        amount: course.price,
        instructorName: 'Giảng viên'
      }
    });
  };

  const handleFreeEnroll = async () => {
    setEnrolling(true);
    try {
      const courseId = courseInfo?.id || lesson?.module?.course?.id;
      if (!courseId) {
        toast.error('Không tìm thấy thông tin khóa học');
        return;
      }
      await api.post(`/api/courses/${courseId}/enroll`);
      toast.success('Đăng ký khóa học thành công!');
      fetchLesson();
    } catch (error) {
      console.error('Enroll error:', error);
      toast.error('Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-white">Đang tải bài học...</div>
      </div>
    );
  }

  if (error) {
    const course = courseInfo || lesson?.module?.course;
    const isFreeCourse = course?.price === 0;
    
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <LockClosedIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Không thể truy cập</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          
          {!isAuthenticated ? (
            <PrimaryButton onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </PrimaryButton>
          ) : (
            <div className="space-y-3">
              {isFreeCourse ? (
                <PrimaryButton 
                  onClick={handleFreeEnroll} 
                  disabled={enrolling}
                  className="w-full"
                >
                  {enrolling ? 'Đang xử lý...' : 'Đăng ký miễn phí'}
                </PrimaryButton>
              ) : (
                <PrimaryButton 
                  onClick={handleGoToCheckout} 
                  className="w-full flex items-center justify-center"
                >
                  <CreditCardIcon className="w-5 h-5 mr-2" />
                  Đăng ký khóa học {course?.price ? `(${course.price} USD)` : ''}
                </PrimaryButton>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  const isFree = lesson?.isFree;

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white mb-6 group"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </button>

        {/* Free badge */}
        {isFree && (
          <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
            <AcademicCapIcon className="w-4 h-4 mr-1" />
            Bài học miễn phí
          </div>
        )}

        {/* Lesson content */}
        <GlassCard className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">{lesson?.title}</h1>
          
          {/* Video Player */}
          {lesson?.type === 'VIDEO' && lesson?.content && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              {isYouTubeUrl(lesson.content) ? (
                <iframe
                  src={getYouTubeEmbedUrl(lesson.content)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson?.title}
                />
              ) : (
                <video
                  src={lesson.content}
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                />
              )}
            </div>
          )}

          {/* Text content */}
          {lesson?.type === 'TEXT' && (
            <div className="bg-white/5 rounded-lg p-6 mb-4">
              <p className="text-gray-300 whitespace-pre-wrap">{lesson?.content}</p>
            </div>
          )}

          {/* Description */}
          {lesson?.description && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Mô tả bài học</h3>
              <p className="text-gray-400">{lesson.description}</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}