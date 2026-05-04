// frontend/src/pages/ManageContentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  VideoCameraIcon, 
  DocumentTextIcon, 
  PuzzlePieceIcon,
  CheckIcon,
  PencilIcon,
  XMarkIcon,
  FolderPlusIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';

export default function ManageContentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  
  // State cho editing
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [addingModule, setAddingModule] = useState(false);
  const [addingLesson, setAddingLesson] = useState(null);
  
  // Form data tạm thời khi edit
  const [tempModuleData, setTempModuleData] = useState({ title: '', description: '' });
  const [tempLessonData, setTempLessonData] = useState({
    title: '', description: '', type: 'VIDEO', content: '', duration: 0, isFree: false
  });
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonData, setNewLessonData] = useState({
    title: '', type: 'VIDEO', content: '', duration: 0, isFree: false
  });

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await courseService.getCourseById(courseId);
      setCourse(response.data);
      if (response.data.modules) {
        setModules(response.data.modules);
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Không thể tải thông tin khóa học');
      navigate('/instructor/courses');
    } finally {
      setLoading(false);
    }
  };

  // ========== MODULE FUNCTIONS ==========
  
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) {
      toast.error('Vui lòng nhập tên chương');
      return;
    }
    try {
      await courseService.addModule(courseId, {
        title: newModuleTitle.trim(),
        description: '',
        order: modules.length
      });
      toast.success('Thêm chương thành công');
      setNewModuleTitle('');
      setAddingModule(false);
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thêm chương thất bại');
    }
  };

  const startEditModule = (module) => {
    setEditingModule(module.id);
    setTempModuleData({
      title: module.title,
      description: module.description || ''
    });
  };

  const cancelEditModule = () => {
    setEditingModule(null);
    setTempModuleData({ title: '', description: '' });
  };

  // frontend/src/pages/ManageContentPage.jsx
// Sửa lại hàm saveModule

const saveModule = async (moduleId) => {
  if (!tempModuleData.title.trim()) {
    toast.error('Tên chương không được để trống');
    return;
  }
  try {
    // Chỉ gửi các trường backend cho phép
    const updateData = {
      title: tempModuleData.title.trim(),
      description: tempModuleData.description.trim() || ''
    };
    
    console.log('📤 Updating module:', { moduleId, updateData });
    
    await courseService.updateModule(moduleId, updateData);
    toast.success('Cập nhật chương thành công');
    setEditingModule(null);
    fetchCourse();
  } catch (error) {
    console.error('Update module error:', error);
    console.error('Error response:', error.response?.data);
    toast.error(error.response?.data?.message || 'Cập nhật thất bại');
  }
};

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Bạn có chắc muốn xóa chương này? Tất cả bài học sẽ bị xóa!')) return;
    try {
      await courseService.deleteModule(moduleId);
      toast.success('Xóa chương thành công');
      fetchCourse();
    } catch (error) {
      toast.error('Xóa chương thất bại');
    }
  };

  // ========== LESSON FUNCTIONS ==========
  
  const startEditLesson = (lesson) => {
    setEditingLesson(lesson.id);
    setTempLessonData({
      title: lesson.title,
      description: lesson.description || '',
      type: lesson.type || 'VIDEO',
      content: lesson.content || '',
      duration: lesson.duration || 0,
      isFree: lesson.isFree || false
    });
  };

  const cancelEditLesson = () => {
    setEditingLesson(null);
    setTempLessonData({
      title: '', description: '', type: 'VIDEO', content: '', duration: 0, isFree: false
    });
  };

  const saveLesson = async (lessonId) => {
    if (!tempLessonData.title.trim()) {
      toast.error('Tên bài học không được để trống');
      return;
    }
    try {
      await courseService.updateLesson(lessonId, {
        title: tempLessonData.title.trim(),
        description: tempLessonData.description.trim(),
        type: tempLessonData.type,
        content: tempLessonData.content,
        duration: Number(tempLessonData.duration) || 0,
        isFree: tempLessonData.isFree
      });
      toast.success('Cập nhật bài học thành công');
      setEditingLesson(null);
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleAddLesson = async (moduleId) => {
    if (!newLessonData.title.trim()) {
      toast.error('Vui lòng nhập tên bài học');
      return;
    }
    const module = modules.find(m => m.id === moduleId);
    try {
      await courseService.addLesson(moduleId, {
        title: newLessonData.title.trim(),
        description: newLessonData.description || '',
        type: newLessonData.type,
        content: newLessonData.content || '',
        duration: Number(newLessonData.duration) || 0,
        order: module?.lessons?.length || 0,
        isFree: newLessonData.isFree || false
      });
      toast.success('Thêm bài học thành công');
      setNewLessonData({ title: '', type: 'VIDEO', content: '', duration: 0, isFree: false });
      setAddingLesson(null);
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thêm bài học thất bại');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Bạn có chắc muốn xóa bài học này?')) return;
    try {
      await courseService.deleteLesson(lessonId);
      toast.success('Xóa bài học thành công');
      fetchCourse();
    } catch (error) {
      toast.error('Xóa bài học thất bại');
    }
  };

  const lessonTypes = [
    { value: 'VIDEO', label: 'Video', icon: VideoCameraIcon },
    { value: 'TEXT', label: 'Văn bản', icon: DocumentTextIcon },
    { value: 'QUIZ', label: 'Bài tập', icon: PuzzlePieceIcon },
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/instructor/courses" className="inline-flex items-center text-gray-400 hover:text-white mb-2 group">
              <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Quay lại dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">Quản lý nội dung: {course?.title}</h1>
            <p className="text-gray-400 mt-1">Thêm, sửa, xóa chương và bài học</p>
          </div>
        </div>

        {/* Add Module Button */}
        <div className="flex justify-end mb-6">
          {addingModule ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Tên chương mới"
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white w-64"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddModule();
                  if (e.key === 'Escape') setAddingModule(false);
                }}
              />
              <button onClick={handleAddModule} className="p-2 bg-green-600 rounded-lg hover:bg-green-700">
                <CheckIcon className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setAddingModule(false)} className="p-2 bg-red-600 rounded-lg hover:bg-red-700">
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingModule(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FolderPlusIcon className="w-5 h-5" />
              Thêm chương mới
            </button>
          )}
        </div>

        {/* Modules List */}
        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className="bg-white/10 rounded-2xl p-12 text-center">
              <p className="text-gray-400 mb-4">Khóa học chưa có nội dung</p>
              <button onClick={() => setAddingModule(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl">
                + Thêm chương đầu tiên
              </button>
            </div>
          ) : (
            modules.map((module, moduleIdx) => (
              <div key={module.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
                {/* Module Header */}
                <div className="p-5 border-b border-white/10 bg-white/5">
                  {editingModule === module.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={tempModuleData.title}
                        onChange={(e) => setTempModuleData({ ...tempModuleData, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-lg font-semibold"
                        placeholder="Tên chương"
                      />
                      <textarea
                        value={tempModuleData.description}
                        onChange={(e) => setTempModuleData({ ...tempModuleData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        placeholder="Mô tả chương (tùy chọn)"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveModule(module.id)} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
                          <CheckIcon className="w-4 h-4" /> Lưu
                        </button>
                        <button onClick={cancelEditModule} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 flex items-center gap-2">
                          <XMarkIcon className="w-4 h-4" /> Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white">
                          Chương {moduleIdx + 1}: {module.title}
                        </h2>
                        {module.description && (
                          <p className="text-gray-400 text-sm mt-1">{module.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditModule(module)} className="p-2 text-blue-400 hover:text-blue-300">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteModule(module.id)} className="p-2 text-red-400 hover:text-red-300">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lessons List */}
                <div className="p-5">
                  <div className="space-y-3">
                    {module.lessons?.map((lesson, lessonIdx) => (
                      <div key={lesson.id} className="bg-white/5 rounded-xl p-4">
                        {editingLesson === lesson.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={tempLessonData.title}
                              onChange={(e) => setTempLessonData({ ...tempLessonData, title: e.target.value })}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium"
                              placeholder="Tên bài học"
                            />
                            <textarea
                              value={tempLessonData.description}
                              onChange={(e) => setTempLessonData({ ...tempLessonData, description: e.target.value })}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              placeholder="Mô tả bài học"
                              rows={2}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={tempLessonData.type}
                                onChange={(e) => setTempLessonData({ ...tempLessonData, type: e.target.value })}
                                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                              >
                                {lessonTypes.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={tempLessonData.duration}
                                onChange={(e) => setTempLessonData({ ...tempLessonData, duration: parseInt(e.target.value) || 0 })}
                                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                placeholder="Thời lượng (phút)"
                              />
                            </div>
                            <input
                              type="text"
                              value={tempLessonData.content}
                              onChange={(e) => setTempLessonData({ ...tempLessonData, content: e.target.value })}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                              placeholder={tempLessonData.type === 'VIDEO' ? 'URL video (YouTube)' : 'Nội dung bài học'}
                            />
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={tempLessonData.isFree}
                                onChange={(e) => setTempLessonData({ ...tempLessonData, isFree: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-gray-300 text-sm">Bài học miễn phí</span>
                            </label>
                            <div className="flex gap-2 justify-end mt-3">
                              <button onClick={() => saveLesson(lesson.id)} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
                                <CheckIcon className="w-4 h-4" /> Lưu
                              </button>
                              <button onClick={cancelEditLesson} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 flex items-center gap-2">
                                <XMarkIcon className="w-4 h-4" /> Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium">
                                  Bài {lessonIdx + 1}: {lesson.title}
                                </span>
                                {lesson.isFree && (
                                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Miễn phí</span>
                                )}
                                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                  {lesson.type === 'VIDEO' ? 'Video' : lesson.type === 'TEXT' ? 'Văn bản' : 'Bài tập'}
                                </span>
                                {lesson.duration > 0 && (
                                  <span className="text-xs text-gray-500">{lesson.duration} phút</span>
                                )}
                              </div>
                              {lesson.description && (
                                <p className="text-gray-400 text-sm mt-1">{lesson.description}</p>
                              )}
                              {lesson.content && (
                                <p className="text-gray-500 text-xs mt-1 truncate">📎 {lesson.content}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <button onClick={() => startEditLesson(lesson)} className="p-1.5 text-blue-400 hover:text-blue-300">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-red-400 hover:text-red-300">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Lesson Button */}
                    {addingLesson === module.id ? (
                      <div className="bg-white/5 rounded-xl p-4 mt-2">
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newLessonData.title}
                            onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            placeholder="Tên bài học"
                            autoFocus
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={newLessonData.type}
                              onChange={(e) => setNewLessonData({ ...newLessonData, type: e.target.value })}
                              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            >
                              {lessonTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={newLessonData.duration}
                              onChange={(e) => setNewLessonData({ ...newLessonData, duration: parseInt(e.target.value) || 0 })}
                              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                              placeholder="Thời lượng (phút)"
                            />
                          </div>
                          <input
                            type="text"
                            value={newLessonData.content}
                            onChange={(e) => setNewLessonData({ ...newLessonData, content: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            placeholder={newLessonData.type === 'VIDEO' ? 'URL video (YouTube)' : 'Nội dung bài học'}
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newLessonData.isFree}
                              onChange={(e) => setNewLessonData({ ...newLessonData, isFree: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-300 text-sm">Bài học miễn phí</span>
                          </label>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleAddLesson(module.id)} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700">
                              Thêm
                            </button>
                            <button onClick={() => setAddingLesson(null)} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">
                              Hủy
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingLesson(module.id)}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <DocumentPlusIcon className="w-4 h-4" />
                        Thêm bài học
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}