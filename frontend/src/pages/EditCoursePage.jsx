// frontend/src/pages/EditCoursePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
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

export default function EditCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [courseData, setCourseData] = useState({
    title: '', description: '', price: 0, level: 'BEGINNER', thumbnail: '', status: 'DRAFT'
  });
  
  const [modules, setModules] = useState([]);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingLesson, setAddingLesson] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await courseService.getCourseById(id);
      const course = response.data;
      
      setCourseData({
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        level: course.level || 'BEGINNER',
        thumbnail: course.thumbnail || '',
        status: course.status || 'DRAFT'
      });
      
      if (course.modules && course.modules.length > 0) {
        setModules(course.modules.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          order: m.order,
          lessons: m.lessons?.map(l => ({
            id: l.id,
            title: l.title,
            description: l.description || '',
            type: l.type || 'VIDEO',
            content: l.content || '',
            duration: l.duration || 0,
            order: l.order,
            isFree: l.isFree || false
          })) || []
        })));
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error('Fetch course error:', error);
      toast.error('Không thể tải thông tin khóa học');
      navigate('/instructor/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourseData({ ...courseData, [name]: value });
  };

  // ========== MODULE FUNCTIONS ==========
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) {
      toast.error('Vui lòng nhập tên chương');
      return;
    }
    if (newModuleTitle.trim().length < 3) {
      toast.error('Tên chương phải có ít nhất 3 ký tự');
      return;
    }
    
    setSaving(true);
    try {
      const response = await courseService.addModule(id, { 
        title: newModuleTitle.trim(), 
        description: '', 
        order: modules.length 
      });
      
      if (response.success) {
        toast.success('Thêm chương thành công');
        setNewModuleTitle('');
        setAddingModule(false);
        await fetchCourse();
      } else {
        throw new Error(response.message || 'Thêm chương thất bại');
      }
    } catch (error) {
      console.error('Add module error:', error);
      toast.error(error.response?.data?.message || 'Thêm chương thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateModule = async (moduleId, newTitle) => {
    if (!newTitle?.trim()) {
      toast.error('Tên chương không được để trống');
      return;
    }
    if (newTitle.trim().length < 3) {
      toast.error('Tên chương phải có ít nhất 3 ký tự');
      return;
    }
    
    setSaving(true);
    try {
      const response = await courseService.updateModule(moduleId, { 
        title: newTitle.trim(),
        description: '' 
      });
      
      if (response.success) {
        toast.success('Cập nhật chương thành công');
        setEditingModule(null);
        await fetchCourse();
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update module error:', error);
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Bạn có chắc muốn xóa chương này? Tất cả bài học sẽ bị xóa!')) return;
    
    setSaving(true);
    try {
      const response = await courseService.deleteModule(moduleId);
      if (response.success) {
        toast.success('Xóa chương thành công');
        await fetchCourse();
      } else {
        throw new Error(response.message || 'Xóa chương thất bại');
      }
    } catch (error) {
      console.error('Delete module error:', error);
      toast.error(error.response?.data?.message || 'Xóa chương thất bại');
    } finally {
      setSaving(false);
    }
  };

  // ========== LESSON FUNCTIONS ==========
  const handleAddLesson = async (moduleId) => {
    if (!newLessonTitle.trim()) {
      toast.error('Vui lòng nhập tên bài học');
      return;
    }
    if (newLessonTitle.trim().length < 3) {
      toast.error('Tên bài học phải có ít nhất 3 ký tự');
      return;
    }
    if (!newLessonContent.trim()) {
      toast.error('Vui lòng nhập nội dung bài học (URL video)');
      return;
    }
    
    // Validate URL
    const url = newLessonContent.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('URL video phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    
    const module = modules.find(m => m.id === moduleId);
    // Tính order mới
    let maxOrder = 0;
    if (module?.lessons && module.lessons.length > 0) {
      const orders = module.lessons.map(l => l.order || 0);
      maxOrder = Math.max(...orders) + 1;
    }
    
    setSaving(true);
    try {
      const response = await courseService.addLesson(moduleId, {
        title: newLessonTitle.trim(),
        description: '',
        type: 'VIDEO',
        content: url,
        duration: 0,
        order: maxOrder,
        isFree: false
      });
      
      if (response.success) {
        toast.success('Thêm bài học thành công');
        setNewLessonTitle('');
        setNewLessonContent('');
        setAddingLesson(null);
        await fetchCourse();
      } else {
        throw new Error(response.message || 'Thêm bài học thất bại');
      }
    } catch (error) {
      console.error('Add lesson error:', error);
      toast.error(error.response?.data?.message || 'Thêm bài học thất bại');
    } finally {
      setSaving(false);
    }
  };

  // QUAN TRỌNG: Sửa hàm update lesson - KHÔNG gửi order, gửi đủ content
  const handleUpdateLesson = async (lessonId) => {
    // Lấy lesson hiện tại
    let currentLesson = null;
    for (const module of modules) {
      const found = module.lessons?.find(l => l.id === lessonId);
      if (found) {
        currentLesson = found;
        break;
      }
    }
    
    if (!currentLesson) {
      toast.error('Không tìm thấy bài học');
      return;
    }
    
    setSaving(true);
    try {
      // Gửi đầy đủ dữ liệu hiện tại của lesson, KHÔNG gửi order
      const response = await courseService.updateLesson(lessonId, {
        title: currentLesson.title,
        description: currentLesson.description || '',
        type: currentLesson.type || 'VIDEO',
        content: currentLesson.content || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: currentLesson.duration || 0,
        isFree: currentLesson.isFree || false
      });
      
      if (response.success) {
        toast.success('Cập nhật bài học thành công');
        setEditingLesson(null);
        await fetchCourse();
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update lesson error:', error);
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Bạn có chắc muốn xóa bài học này?')) return;
    
    setSaving(true);
    try {
      const response = await courseService.deleteLesson(lessonId);
      if (response.success) {
        toast.success('Xóa bài học thành công');
        await fetchCourse();
      } else {
        throw new Error(response.message || 'Xóa bài học thất bại');
      }
    } catch (error) {
      console.error('Delete lesson error:', error);
      toast.error(error.response?.data?.message || 'Xóa bài học thất bại');
    } finally {
      setSaving(false);
    }
  };

  // ========== SUBMIT COURSE ==========
  const handleSubmit = async () => {
    if (!courseData.title?.trim()) {
      toast.error('Vui lòng nhập tên khóa học');
      return;
    }
    if (courseData.title.trim().length < 5) {
      toast.error('Tên khóa học phải có ít nhất 5 ký tự');
      return;
    }
    if (!courseData.description?.trim()) {
      toast.error('Vui lòng nhập mô tả khóa học');
      return;
    }
    if (courseData.description.trim().length < 20) {
      toast.error('Mô tả khóa học phải có ít nhất 20 ký tự');
      return;
    }
    
    const priceNum = Number(courseData.price);
    if (isNaN(priceNum) || priceNum < 0 || priceNum > 9999) {
      toast.error('Giá khóa học không hợp lệ (0-9999 USD)');
      return;
    }

    setSaving(true);
    try {
      const updatePayload = {
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        price: priceNum,
        level: courseData.level,
      };
      
      console.log('📤 Sending update payload:', updatePayload);
      
      const response = await courseService.updateCourse(id, updatePayload);
      if (response.success) {
        toast.success('Cập nhật thông tin khóa học thành công!');
        navigate('/instructor/courses');
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update course error:', error);
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const levelOptions = [
    { value: 'BEGINNER', label: 'Cơ bản' },
    { value: 'INTERMEDIATE', label: 'Trung cấp' },
    { value: 'ADVANCED', label: 'Nâng cao' },
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/instructor/courses" className="inline-flex items-center text-gray-400 hover:text-white mb-2 group">
              <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Quay lại dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Chỉnh sửa khóa học</h1>
            <p className="text-gray-400 mt-1">Cập nhật thông tin và nội dung khóa học</p>
          </div>
          <div>
            {courseData.status === 'DRAFT' && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">Bản nháp</span>}
            {courseData.status === 'PUBLISHED' && <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full">Đã xuất bản</span>}
          </div>
        </div>

        <div className="flex space-x-2 mb-8 border-b border-white/10">
          <button onClick={() => setActiveTab('basic')} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'basic' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            Thông tin cơ bản
          </button>
          <button onClick={() => setActiveTab('modules')} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'modules' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            Nội dung khóa học ({modules.reduce((sum, m) => sum + m.lessons.length, 0)} bài)
          </button>
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Tên khóa học <span className="text-red-400">*</span></label>
                <input type="text" name="title" value={courseData.title} onChange={handleCourseChange} className="w-full px-4 py-3 bg-white/5 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Mô tả khóa học <span className="text-red-400">*</span></label>
                <textarea name="description" value={courseData.description} onChange={handleCourseChange} rows={5} className="w-full px-4 py-3 bg-white/5 rounded-xl text-white resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Giá (USD)</label>
                  <input type="number" name="price" value={courseData.price} onChange={handleCourseChange} className="w-full px-4 py-3 bg-white/5 rounded-xl text-white" />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Trình độ</label>
                  <select name="level" value={courseData.level} onChange={handleCourseChange} className="w-full px-4 py-3 bg-white/5 rounded-xl text-white">
                    {levelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Thumbnail (URL)</label>
                <input type="text" name="thumbnail" value={courseData.thumbnail} onChange={handleCourseChange} className="w-full px-4 py-3 bg-white/5 rounded-xl text-white" />
                {courseData.thumbnail && <img src={courseData.thumbnail} alt="Preview" className="w-48 h-32 object-cover rounded-lg mt-3" />}
              </div>
              <div className="flex justify-end">
                <button onClick={handleSubmit} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 disabled:opacity-50">
                  <CheckIcon className="w-5 h-5" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Add Module Button */}
            <div className="flex justify-end">
              {addingModule ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newModuleTitle} 
                    onChange={(e) => setNewModuleTitle(e.target.value)} 
                    placeholder="Tên chương (tối thiểu 3 ký tự)" 
                    className="px-4 py-2 bg-white/10 rounded-lg text-white w-64" 
                    autoFocus 
                    disabled={saving}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') handleAddModule(); 
                      if (e.key === 'Escape') setAddingModule(false); 
                    }} 
                  />
                  <button onClick={handleAddModule} disabled={saving} className="p-2 text-green-400 disabled:opacity-50">
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setAddingModule(false)} className="p-2 text-red-400">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAddingModule(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                  <FolderPlusIcon className="w-4 h-4" /> Thêm chương
                </button>
              )}
            </div>

            {modules.length === 0 ? (
              <div className="bg-white/10 rounded-2xl p-12 text-center">
                <p className="text-gray-400 mb-4">Khóa học chưa có nội dung</p>
                <button onClick={() => setAddingModule(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl">+ Thêm chương đầu tiên</button>
              </div>
            ) : (
              modules.map((module, idx) => (
                <div key={module.id} className="bg-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {editingModule === module.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            defaultValue={module.title} 
                            onBlur={(e) => handleUpdateModule(module.id, e.target.value)}
                            onKeyDown={(e) => { 
                              if (e.key === 'Enter') handleUpdateModule(module.id, e.target.value); 
                              if (e.key === 'Escape') setEditingModule(null); 
                            }} 
                            className="px-3 py-1 bg-white/10 rounded-lg text-white text-lg font-semibold" 
                            autoFocus 
                            disabled={saving}
                          />
                          <button onClick={(e) => handleUpdateModule(module.id, e.target.previousSibling?.value)} disabled={saving} className="p-1 text-green-400">
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => setEditingModule(null)} className="p-1 text-red-400">
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <h2 className="text-xl font-semibold text-white">Chương {idx + 1}: {module.title}</h2>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingModule(module.id)} className="p-1 text-gray-400 hover:text-white">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteModule(module.id)} disabled={saving} className="p-1 text-red-400 hover:text-red-300">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="ml-6 space-y-2">
                    {module.lessons.map((lesson, lessonIdx) => (
                      <div key={lesson.id} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg group">
                        <div className="flex items-center gap-3 flex-1">
                          {editingLesson === lesson.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input 
                                type="text" 
                                defaultValue={lesson.title} 
                                onBlur={(e) => {
                                  // Cập nhật title tạm thời trong state
                                  const updatedLessons = [...modules];
                                  for (const m of updatedLessons) {
                                    const l = m.lessons?.find(l => l.id === lesson.id);
                                    if (l) {
                                      l.title = e.target.value;
                                      break;
                                    }
                                  }
                                  setModules(updatedLessons);
                                }}
                                className="px-3 py-1 bg-white/10 rounded-lg text-white flex-1" 
                                autoFocus 
                                disabled={saving}
                              />
                              <button onClick={() => handleUpdateLesson(lesson.id)} disabled={saving} className="p-1 text-green-400">
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => setEditingLesson(null)} className="p-1 text-red-400">
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-gray-300">Bài {lessonIdx + 1}: {lesson.title}</span>
                              {lesson.isFree && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Miễn phí</span>}
                            </>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setEditingLesson(lesson.id)} className="p-1 text-gray-400 hover:text-white">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteLesson(lesson.id)} disabled={saving} className="p-1 text-red-400 hover:text-red-300">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {addingLesson === module.id ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newLessonTitle} 
                            onChange={(e) => setNewLessonTitle(e.target.value)} 
                            placeholder="Tên bài học (tối thiểu 3 ký tự)" 
                            className="px-3 py-1 bg-white/10 rounded-lg text-white flex-1" 
                            autoFocus 
                            disabled={saving}
                          />
                          <input 
                            type="text" 
                            value={newLessonContent} 
                            onChange={(e) => setNewLessonContent(e.target.value)} 
                            placeholder="URL video (VD: https://youtu.be/...)" 
                            className="px-3 py-1 bg-white/10 rounded-lg text-white flex-1" 
                            disabled={saving}
                          />
                          <button onClick={() => handleAddLesson(module.id)} disabled={saving} className="p-1 text-green-400">
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => setAddingLesson(null)} className="p-1 text-red-400">
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">⚠️ Bắt buộc nhập URL video hợp lệ (bắt đầu bằng http:// hoặc https://)</p>
                      </div>
                    ) : (
                      <button onClick={() => setAddingLesson(module.id)} className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <DocumentPlusIcon className="w-4 h-4" /> Thêm bài học
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="flex justify-end pt-4">
              <button onClick={handleSubmit} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center gap-2 disabled:opacity-50">
                <CheckIcon className="w-5 h-5" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}