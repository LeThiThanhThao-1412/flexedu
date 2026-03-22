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
  AcademicCapIcon,
  ArrowLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function LearningPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchCourse();
    loadProgressFromLocal();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await courseService.getCourseById(courseId);
      setCourse(response.data);
      
      // Set first lesson as default
      const firstModule = response.data.modules?.[0];
      const firstLesson = firstModule?.lessons?.[0];
      if (firstLesson) {
        setCurrentLesson(firstLesson);
        setCurrentModule(firstModule);
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Không thể tải khóa học');
    } finally {
      setLoading(false);
    }
  };

  // Load tiến độ từ localStorage
  const loadProgressFromLocal = () => {
    const savedCompleted = localStorage.getItem(`completed_lessons_${courseId}`);
    if (savedCompleted) {
      const completed = JSON.parse(savedCompleted);
      setCompletedLessons(completed);
      // Tính tiến độ
      const allLessons = getAllLessonIdsFromStorage();
      if (allLessons.length > 0) {
        const completedCount = allLessons.filter(id => completed.includes(id)).length;
        const newProgress = Math.round((completedCount / allLessons.length) * 100);
        setProgress(newProgress);
      }
    }
  };

  // Lấy tất cả lesson IDs từ course (dùng cho localStorage)
  const getAllLessonIdsFromStorage = () => {
    if (!course?.modules) return [];
    return course.modules.flatMap(module => 
      module.lessons?.map(lesson => lesson.id) || []
    );
  };

  // Lấy tất cả lesson IDs trong khóa học
  const getAllLessonIds = () => {
    if (!course?.modules) return [];
    return course.modules.flatMap(module => 
      module.lessons?.map(lesson => lesson.id) || []
    );
  };

  // Tính tiến độ dựa trên số lesson đã hoàn thành
  const calculateProgress = (completedIds) => {
    const allLessonIds = getAllLessonIds();
    if (allLessonIds.length === 0) return 0;
    const completedCount = allLessonIds.filter(id => completedIds.includes(id)).length;
    return Math.round((completedCount / allLessonIds.length) * 100);
  };

  // Đánh dấu bài học hoàn thành
  const markLessonComplete = async () => {
    if (!currentLesson) return;
    if (completedLessons.includes(currentLesson.id)) {
      toast('Bài học này đã được đánh dấu hoàn thành rồi!', {
        icon: '✅',
      });
      return;
    }

    setUpdatingProgress(true);
    try {
      // Cập nhật state local
      const newCompletedLessons = [...completedLessons, currentLesson.id];
      setCompletedLessons(newCompletedLessons);
      
      // Lưu vào localStorage
      localStorage.setItem(`completed_lessons_${courseId}`, JSON.stringify(newCompletedLessons));
      
      // Tính lại tiến độ
      const newProgress = calculateProgress(newCompletedLessons);
      setProgress(newProgress);
      
      // Gọi API cập nhật tiến độ (nếu có)
      try {
        await courseService.updateProgress({
          lessonId: currentLesson.id,
          completed: true,
          totalLessons: getAllLessonIds().length,
          lessonIds: getAllLessonIds()
        });
      } catch (apiError) {
        console.log('API update failed but local saved');
      }
      
      toast.success('🎉 Hoàn thành bài học! Tiếp tục nào!');
      
      // Tự động chuyển sang bài tiếp theo sau 1.5 giây
      setTimeout(() => {
        handleNextLesson();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
      toast.error('Không thể cập nhật tiến độ, vui lòng thử lại');
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Chuyển đến bài học tiếp theo
  const handleNextLesson = () => {
    if (!course?.modules) return;
    
    // Tìm tất cả lessons theo thứ tự
    const allLessons = [];
    course.modules.forEach(module => {
      module.lessons?.forEach(lesson => {
        allLessons.push({
          ...lesson,
          moduleId: module.id,
          moduleTitle: module.title
        });
      });
    });
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      setCurrentLesson(nextLesson);
      // Tìm module chứa bài học tiếp theo
      const nextModule = course.modules.find(m => m.id === nextLesson.moduleId);
      setCurrentModule(nextModule);
      
      // Scroll lên đầu trang
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Đã hoàn thành tất cả bài học
      if (completedLessons.length === allLessons.length) {
        toast.success('🏆 Chúc mừng! Bạn đã hoàn thành xuất sắc khóa học!');
      } else {
        toast('📚 Bạn đã học xong tất cả bài học! Hãy đánh dấu hoàn thành các bài còn lại.', {
          icon: '🎯',
        });
      }
    }
  };

  // Chuyển đến bài học trước đó
  const handlePrevLesson = () => {
    if (!course?.modules) return;
    
    const allLessons = [];
    course.modules.forEach(module => {
      module.lessons?.forEach(lesson => {
        allLessons.push({
          ...lesson,
          moduleId: module.id,
          moduleTitle: module.title
        });
      });
    });
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      setCurrentLesson(prevLesson);
      const prevModule = course.modules.find(m => m.id === prevLesson.moduleId);
      setCurrentModule(prevModule);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Chọn bài học từ sidebar
  const handleSelectLesson = (lesson, module) => {
    setCurrentLesson(lesson);
    setCurrentModule(module);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-white">Đang tải khóa học...</div>
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

  const allLessonsCount = getAllLessonIds().length;
  const completedCount = completedLessons.length;

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <Link to={`/courses/${courseId}`} className="flex items-center text-gray-400 hover:text-white group">
            <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Quay lại khóa học
          </Link>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full">
            <AcademicCapIcon className="w-4 h-4 text-blue-400" />
            <div className="w-32 bg-white/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-300">{progress}% hoàn thành</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player / Content Area */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard className="overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {currentLesson?.type === 'VIDEO' && currentLesson?.content ? (
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
                    <p className="text-gray-400 mb-4">Nội dung bài học dạng văn bản</p>
                    <div className="mt-4 p-6 bg-white/5 rounded-lg max-h-96 overflow-y-auto">
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {currentLesson?.content || 'Nội dung đang được cập nhật...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Lesson Info & Actions */}
            <GlassCard className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-400 text-sm mb-1">
                    {currentModule?.title || 'Bài học'}
                  </p>
                  <h2 className="text-xl font-bold text-white">{currentLesson?.title}</h2>
                </div>
                {currentLesson?.duration && (
                  <div className="flex items-center text-gray-400 text-sm">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {currentLesson.duration} phút
                  </div>
                )}
              </div>
              
              <p className="text-gray-400 mb-6">{currentLesson?.description}</p>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={markLessonComplete}
                  disabled={updatingProgress || isLessonCompleted(currentLesson?.id)}
                  className={`px-5 py-2.5 rounded-xl transition flex items-center ${
                    isLessonCompleted(currentLesson?.id)
                      ? 'bg-green-600/20 text-green-400 cursor-default'
                      : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                  }`}
                >
                  {isLessonCompleted(currentLesson?.id) ? (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Đã hoàn thành
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      {updatingProgress ? 'Đang cập nhật...' : 'Đánh dấu hoàn thành'}
                    </>
                  )}
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrevLesson}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Bài trước
                  </button>
                  <button
                    onClick={handleNextLesson}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    Bài tiếp theo
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar - Course Content & Progress */}
          <div className="space-y-4">
            {/* Progress Card */}
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-400" />
                Tiến độ học tập
              </h3>
              <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-gray-400">{completedCount} / {allLessonsCount} bài học</p>
                <p className="text-blue-400 font-medium">{progress}% hoàn thành</p>
              </div>
              {progress === 100 && (
                <div className="mt-3 p-2 bg-green-600/20 rounded-lg text-center">
                  <p className="text-green-400 text-sm">🎉 Chúc mừng! Bạn đã hoàn thành khóa học!</p>
                </div>
              )}
            </GlassCard>

            {/* Course Content */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Nội dung khóa học</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {course.modules?.map((module, moduleIdx) => (
                  <div key={module.id}>
                    <div className="text-blue-400 text-sm font-medium mb-2">
                      Chương {moduleIdx + 1}: {module.title}
                    </div>
                    <div className="space-y-1 ml-2">
                      {module.lessons?.map((lesson, lessonIdx) => {
                        const completed = isLessonCompleted(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson, module)}
                            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                              currentLesson?.id === lesson.id
                                ? 'bg-blue-600/30 text-white border border-blue-500/50'
                                : completed
                                ? 'text-green-400 hover:text-white hover:bg-white/5'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center">
                              {completed ? (
                                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              ) : (
                                <PlayCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                              )}
                              <span className="text-sm">
                                Bài {lessonIdx + 1}: {lesson.title}
                              </span>
                            </div>
                            {lesson.duration && (
                              <span className="text-xs text-gray-500">{lesson.duration} phút</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}