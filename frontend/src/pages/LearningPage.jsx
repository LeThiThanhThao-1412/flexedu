// frontend/src/pages/LearningPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import { PrimaryButton } from '../components/common/Button';
import toast from 'react-hot-toast';
import {
  PlayCircleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function LearningPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await courseService.getCourseById(courseId);
      setCourse(response.data);
      // Set first lesson as default
      const firstLesson = response.data.modules?.[0]?.lessons?.[0];
      if (firstLesson) {
        setCurrentLesson(firstLesson);
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Không thể tải khóa học');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await courseService.getProgress(courseId);
      setProgress(response.data.progress || 0);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const markLessonComplete = async () => {
    if (!currentLesson) return;

    try {
      await courseService.updateProgress({
        lessonId: currentLesson.id,
        completed: true,
        totalLessons: course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0),
        lessonIds: course.modules?.flatMap(m => m.lessons?.map(l => l.id) || [])
      });
      
      setCompletedLessons([...completedLessons, currentLesson.id]);
      toast.success('Hoàn thành bài học!');
      fetchProgress(); // Refresh progress
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    }
  };

  const handleNextLesson = () => {
    // Find next lesson in sequence
    const allLessons = course.modules?.flatMap(m => m.lessons || []) || [];
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    if (currentIndex < allLessons.length - 1) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    } else {
      toast.success('Chúc mừng! Bạn đã hoàn thành khóa học!');
    }
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
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

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to={`/courses/${courseId}`} className="flex items-center text-gray-400 hover:text-white group">
            <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Quay lại khóa học
          </Link>
          <div className="text-sm text-gray-400">
            Tiến độ: {Math.round(progress)}%
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard className="overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {currentLesson?.type === 'VIDEO' ? (
                  <video
                    ref={videoRef}
                    src={currentLesson.content}
                    controls
                    className="w-full h-full"
                    onEnded={markLessonComplete}
                  />
                ) : (
                  <div className="text-center p-8">
                    <BookOpenIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Nội dung bài học dạng văn bản</p>
                    <div className="mt-4 p-4 bg-white/5 rounded-lg">
                      {currentLesson?.content || 'Nội dung đang được cập nhật...'}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Lesson Info */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">{currentLesson?.title}</h2>
              <p className="text-gray-400 mb-4">{currentLesson?.description}</p>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={markLessonComplete}
                  disabled={isLessonCompleted(currentLesson?.id)}
                  className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-5 h-5 inline mr-1" />
                  {isLessonCompleted(currentLesson?.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </button>
                
                <button
                  onClick={handleNextLesson}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                >
                  Bài tiếp theo
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar - Course Content */}
          <div className="space-y-4">
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Nội dung khóa học</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {course.modules?.map((module, moduleIdx) => (
                  <div key={module.id}>
                    <div className="text-blue-400 text-sm mb-2">Chương {moduleIdx + 1}</div>
                    <div className="space-y-1 ml-2">
                      {module.lessons?.map((lesson, lessonIdx) => (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson)}
                          className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                            currentLesson?.id === lesson.id
                              ? 'bg-blue-600/20 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                            ) : (
                              <PlayCircleIcon className="w-4 h-4 mr-2" />
                            )}
                            <span className="text-sm">Bài {lessonIdx + 1}: {lesson.title}</span>
                          </div>
                          {lesson.duration && (
                            <span className="text-xs text-gray-500">{lesson.duration} phút</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Progress Card */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Tiến độ học tập</h3>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">{Math.round(progress)}% hoàn thành</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}