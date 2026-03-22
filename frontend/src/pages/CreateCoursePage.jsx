// frontend/src/pages/CreateCoursePage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/course.service';
import GlassCard from '../components/common/GlassCard';
import GradientText from '../components/common/GradientText';
import { PrimaryButton, SecondaryButton } from '../components/common/Button';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, modules, publish
  
  // Course form data
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: 0,
    level: 'BEGINNER',
    thumbnail: '',
    categoryId: '',
  });
  
  // Modules and Lessons
  const [modules, setModules] = useState([
    {
      id: Date.now(),
      title: 'Chương 1: Giới thiệu',
      description: '',
      order: 0,
      lessons: [
        {
          id: Date.now() + 1,
          title: 'Bài 1: Giới thiệu khóa học',
          description: '',
          type: 'VIDEO',
          content: '',
          duration: 0,
          order: 0,
          isFree: false,
        }
      ]
    }
  ]);

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourseData({ ...courseData, [name]: value });
  };

  // Module functions
  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: `Chương ${modules.length + 1}: Chương mới`,
      description: '',
      order: modules.length,
      lessons: []
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (moduleId, field, value) => {
    setModules(modules.map(module =>
      module.id === moduleId ? { ...module, [field]: value } : module
    ));
  };

  const deleteModule = (moduleId) => {
    if (modules.length === 1) {
      toast.error('Khóa học phải có ít nhất 1 chương');
      return;
    }
    setModules(modules.filter(module => module.id !== moduleId));
  };

  // Lesson functions
  const addLesson = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    const newLesson = {
      id: Date.now(),
      title: `Bài ${module.lessons.length + 1}: Bài học mới`,
      description: '',
      type: 'VIDEO',
      content: '',
      duration: 0,
      order: module.lessons.length,
      isFree: false,
    };
    
    setModules(modules.map(module =>
      module.id === moduleId 
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    ));
  };

  const updateLesson = (moduleId, lessonId, field, value) => {
    setModules(modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
            )
          }
        : module
    ));
  };

  const deleteLesson = (moduleId, lessonId) => {
    setModules(modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
          }
        : module
    ));
  };

  const handleSubmit = async () => {
    // Validate basic info
    if (!courseData.title.trim()) {
      toast.error('Vui lòng nhập tên khóa học');
      return;
    }
    if (!courseData.description.trim()) {
      toast.error('Vui lòng nhập mô tả khóa học');
      return;
    }
    if (courseData.price < 0) {
      toast.error('Giá khóa học không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      // 1. Tạo khóa học
      const response = await courseService.createCourse(courseData);
      const courseId = response.data.id;

      // 2. Tạo modules và lessons
      for (const module of modules) {
        const moduleData = {
          title: module.title,
          description: module.description,
          order: module.order,
        };
        
        const moduleResponse = await courseService.addModule(courseId, moduleData);
        const moduleId = moduleResponse.data.id;

        // 3. Tạo lessons trong module
        for (const lesson of module.lessons) {
          await courseService.addLesson(moduleId, {
            title: lesson.title,
            description: lesson.description,
            type: lesson.type,
            content: lesson.content,
            duration: lesson.duration,
            order: lesson.order,
            isFree: lesson.isFree,
          });
        }
      }

      toast.success('Tạo khóa học thành công!');
      navigate('/instructor/courses');
    } catch (error) {
      console.error('Create course error:', error);
      toast.error('Tạo khóa học thất bại');
    } finally {
      setLoading(false);
    }
  };

  const levelOptions = [
    { value: 'BEGINNER', label: 'Cơ bản' },
    { value: 'INTERMEDIATE', label: 'Trung cấp' },
    { value: 'ADVANCED', label: 'Nâng cao' },
  ];

  const lessonTypes = [
    { value: 'VIDEO', label: 'Video', icon: VideoCameraIcon },
    { value: 'TEXT', label: 'Văn bản', icon: DocumentTextIcon },
    { value: 'QUIZ', label: 'Bài tập', icon: PuzzlePieceIcon },
  ];

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/instructor/courses" className="inline-flex items-center text-gray-400 hover:text-white mb-2 group">
              <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Quay lại dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Tạo khóa học <GradientText>mới</GradientText>
            </h1>
            <p className="text-gray-400 mt-1">Chia sẻ kiến thức của bạn với cộng đồng</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'basic'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Thông tin cơ bản
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === 'modules'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Nội dung khóa học ({modules.reduce((sum, m) => sum + m.lessons.length, 0)} bài)
          </button>
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <GlassCard className="p-6 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Tên khóa học <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={courseData.title}
                  onChange={handleCourseChange}
                  placeholder="VD: Lập trình React từ cơ bản đến nâng cao"
                  className="input-glass w-full"
                />
                <p className="text-gray-500 text-sm mt-1">Hãy đặt tên hấp dẫn và mô tả đúng nội dung</p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Mô tả khóa học <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={courseData.description}
                  onChange={handleCourseChange}
                  rows={5}
                  placeholder="Mô tả chi tiết về khóa học, học viên sẽ học được gì..."
                  className="input-glass w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Giá khóa học (USD)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={courseData.price}
                    onChange={handleCourseChange}
                    min="0"
                    step="0.01"
                    className="input-glass w-full"
                  />
                  <p className="text-gray-500 text-sm mt-1">Để 0 nếu muốn miễn phí</p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Trình độ
                  </label>
                  <select
                    name="level"
                    value={courseData.level}
                    onChange={handleCourseChange}
                    className="input-glass w-full"
                  >
                    {levelOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Ảnh thumbnail (URL)
                </label>
                <input
                  type="text"
                  name="thumbnail"
                  value={courseData.thumbnail}
                  onChange={handleCourseChange}
                  placeholder="https://example.com/image.jpg"
                  className="input-glass w-full"
                />
                {courseData.thumbnail && (
                  <div className="mt-3">
                    <img src={courseData.thumbnail} alt="Preview" className="w-48 h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <PrimaryButton onClick={() => setActiveTab('modules')}>
                  Tiếp theo: Nội dung khóa học →
                </PrimaryButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {modules.map((module, moduleIndex) => (
              <GlassCard key={module.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                      className="text-xl font-bold text-white bg-transparent border-b border-white/20 focus:border-blue-500 outline-none w-full mb-2"
                      placeholder="Tên chương"
                    />
                    <textarea
                      value={module.description}
                      onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                      placeholder="Mô tả chương (tùy chọn)"
                      rows={2}
                      className="w-full text-gray-400 bg-transparent border border-white/10 rounded-lg p-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition ml-4"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Lessons */}
                <div className="space-y-3 ml-6">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                            className="text-white font-medium bg-transparent border-b border-white/20 focus:border-blue-500 outline-none w-full"
                            placeholder="Tên bài học"
                          />
                        </div>
                        <button
                          onClick={() => deleteLesson(module.id, lesson.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(module.id, lesson.id, 'type', e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          {lessonTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={lesson.content}
                          onChange={(e) => updateLesson(module.id, lesson.id, 'content', e.target.value)}
                          placeholder={lesson.type === 'VIDEO' ? 'URL video' : 'Nội dung bài học'}
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500"
                        />

                        <input
                          type="number"
                          value={lesson.duration}
                          onChange={(e) => updateLesson(module.id, lesson.id, 'duration', parseInt(e.target.value) || 0)}
                          placeholder="Thời lượng (phút)"
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                        />

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={lesson.isFree}
                            onChange={(e) => updateLesson(module.id, lesson.id, 'isFree', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-400">Bài học miễn phí</span>
                        </label>
                      </div>

                      <textarea
                        value={lesson.description}
                        onChange={(e) => updateLesson(module.id, lesson.id, 'description', e.target.value)}
                        placeholder="Mô tả bài học"
                        rows={2}
                        className="w-full text-gray-400 bg-transparent border border-white/10 rounded-lg p-2 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => addLesson(module.id)}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition mt-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span className="text-sm">Thêm bài học</span>
                  </button>
                </div>
              </GlassCard>
            ))}

            <div className="flex justify-between items-center">
              <SecondaryButton onClick={addModule}>
                <PlusIcon className="w-4 h-4 mr-1 inline" />
                Thêm chương mới
              </SecondaryButton>

              <div className="flex space-x-3">
                <SecondaryButton onClick={() => setActiveTab('basic')}>
                  ← Quay lại
                </SecondaryButton>
                <PrimaryButton onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Xuất bản khóa học'}
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}