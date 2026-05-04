// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { courseService } from '../services/course.service';
import { authService } from '../services/auth.service';
import GlassCard from '../components/common/GlassCard';
import GradientText from '../components/common/GradientText';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  const [pendingInstructors, setPendingInstructors] = useState([]);
  
  const [courses, setCourses] = useState([]);
  const [coursePagination, setCoursePagination] = useState({});
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatus, setCourseStatus] = useState('ALL');
  const [coursePage, setCoursePage] = useState(1);
  const [courseLoading, setCourseLoading] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({});
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const [userLoading, setUserLoading] = useState(false);
  
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }
    fetchOverviewData();
    fetchPendingInstructors();
  }, []);

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab, coursePage, courseSearch, courseStatus]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userPage, userSearch, userRole]);

  const fetchOverviewData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        courseService.adminGetCourses({ limit: 1 }),
        authService.adminGetUsers({ limit: 1 })
      ]);
      
      setStats({
        totalUsers: usersRes.data?.pagination?.total || 0,
        totalCourses: coursesRes.data?.pagination?.total || 0,
        totalRevenue: 0,
        totalEnrollments: 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Fetch stats error:', error);
      setLoading(false);
    }
  };

  const fetchPendingInstructors = async () => {
    try {
      const response = await courseService.getPendingInstructors();
      setPendingInstructors(response.data || []);
    } catch (error) {
      console.error('Fetch pending instructors error:', error);
    }
  };

  const fetchCourses = async () => {
    setCourseLoading(true);
    try {
      const response = await courseService.adminGetCourses({
        page: coursePage,
        limit: 10,
        status: courseStatus,
        search: courseSearch
      });
      
      if (response.success) {
        setCourses(response.data?.courses || []);
        setCoursePagination(response.data?.pagination || {});
      }
    } catch (error) {
      console.error('Fetch courses error:', error);
      toast.error('Không thể tải danh sách khóa học');
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const response = await authService.adminGetUsers({
        page: userPage,
        limit: 10,
        role: userRole,
        search: userSearch
      });
      
      if (response.success) {
        setUsers(response.data?.users || []);
        setUserPagination(response.data?.pagination || {});
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setUserLoading(false);
    }
  };

  const handleApproveInstructor = async (instructorId) => {
    try {
      await courseService.approveInstructor(instructorId);
      toast.success('Đã duyệt giảng viên thành công');
      setPendingInstructors(pendingInstructors.filter(i => i.id !== instructorId));
      fetchUsers();
    } catch (error) {
      toast.error('Duyệt giảng viên thất bại');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này? Hành động không thể hoàn tác!')) return;
    try {
      await courseService.adminDeleteCourse(courseId);
      toast.success('Xóa khóa học thành công');
      fetchCourses();
    } catch (error) {
      toast.error('Xóa khóa học thất bại');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const response = await authService.adminToggleUserStatus(userId);
      toast.success(response.message || 'Cập nhật trạng thái thành công');
      fetchUsers();
    } catch (error) {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này? Hành động không thể hoàn tác!')) return;
    try {
      await authService.adminDeleteUser(userId);
      toast.success('Xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      toast.error('Xóa người dùng thất bại');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const statusColors = {
    DRAFT: 'bg-yellow-500/20 text-yellow-400',
    PUBLISHED: 'bg-green-500/20 text-green-400',
    ARCHIVED: 'bg-gray-500/20 text-gray-400'
  };

  const roleColors = {
    STUDENT: 'bg-blue-500/20 text-blue-400',
    INSTRUCTOR: 'bg-purple-500/20 text-purple-400',
    ADMIN: 'bg-red-500/20 text-red-400'
  };

  const statCards = [
    { icon: UsersIcon, label: 'Người dùng', value: stats.totalUsers, color: 'from-blue-500 to-cyan-500' },
    { icon: AcademicCapIcon, label: 'Khóa học', value: stats.totalCourses, color: 'from-purple-500 to-pink-500' },
    { icon: CurrencyDollarIcon, label: 'Doanh thu', value: `$${stats.totalRevenue}`, color: 'from-emerald-500 to-teal-500' },
    { icon: ChartBarIcon, label: 'Ghi danh', value: stats.totalEnrollments, color: 'from-orange-500 to-red-500' },
  ];

  if (loading && activeTab === 'overview') {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard <GradientText>Quản trị</GradientText>
          </h1>
          <p className="text-gray-400">Quản lý hệ thống, khóa học và người dùng</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'overview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>Tổng quan</button>
          <button onClick={() => setActiveTab('courses')} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'courses' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>Quản lý khóa học</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>Quản lý người dùng</button>
          <button onClick={() => setActiveTab('instructors')} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'instructors' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            Duyệt giảng viên
            {pendingInstructors.length > 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{pendingInstructors.length}</span>}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
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

            {pendingInstructors.length > 0 && (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Giảng viên chờ duyệt</h2>
                  <button onClick={() => setActiveTab('instructors')} className="text-blue-400 hover:text-blue-300 text-sm">Xem tất cả →</button>
                </div>
                <div className="space-y-3">
                  {pendingInstructors.slice(0, 3).map((instructor) => (
                    <div key={instructor.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{instructor.name}</p>
                        <p className="text-gray-400 text-sm">{instructor.email}</p>
                      </div>
                      <button onClick={() => handleApproveInstructor(instructor.id)} className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition text-sm">Duyệt</button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <GlassCard className="p-6">
            <div className="flex flex-wrap justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setCourseStatus('ALL'); setCoursePage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${courseStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Tất cả</button>
                <button onClick={() => { setCourseStatus('PUBLISHED'); setCoursePage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${courseStatus === 'PUBLISHED' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Đã xuất bản</button>
                <button onClick={() => { setCourseStatus('DRAFT'); setCoursePage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${courseStatus === 'DRAFT' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Bản nháp</button>
                <button onClick={() => { setCourseStatus('ARCHIVED'); setCoursePage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${courseStatus === 'ARCHIVED' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Đã lưu trữ</button>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Tìm kiếm khóa học..." value={courseSearch} onChange={(e) => { setCourseSearch(e.target.value); setCoursePage(1); }} className="pl-9 pr-4 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm" />
              </div>
            </div>

            {courseLoading ? (
              <div className="text-center py-8 text-gray-400">Đang tải...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Không có khóa học nào</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                      <tr className="text-left text-gray-400">
                        <th className="pb-3">Khóa học</th>
                        <th className="pb-3">Giá</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3">Học viên</th>
                        <th className="pb-3">Ngày tạo</th>
                        <th className="pb-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <img src={course.thumbnail || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded object-cover" />
                              <span className="text-white line-clamp-1 max-w-[200px]">{course.title}</span>
                            </div>
                          </td>
                          <td className="text-white">{course.price === 0 ? 'Miễn phí' : `$${course.price}`}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[course.status] || statusColors.DRAFT}`}>
                              {course.status === 'PUBLISHED' ? 'Đã xuất bản' : course.status === 'DRAFT' ? 'Bản nháp' : 'Lưu trữ'}
                            </span>
                          </td>
                          <td className="text-gray-300">{course._count?.enrollments || 0}</td>
                          <td className="text-gray-400 text-sm">{formatDate(course.createdAt)}</td>
                          <td>
                            <button onClick={() => handleDeleteCourse(course.id)} className="p-1 text-red-400 hover:text-red-300" title="Xóa">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {coursePagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button onClick={() => setCoursePage(p => Math.max(1, p - 1))} disabled={coursePage === 1} className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-50">Trước</button>
                    <span className="px-3 py-1 text-white">Trang {coursePage} / {coursePagination.totalPages}</span>
                    <button onClick={() => setCoursePage(p => Math.min(coursePagination.totalPages, p + 1))} disabled={coursePage === coursePagination.totalPages} className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-50">Sau</button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <GlassCard className="p-6">
            <div className="flex flex-wrap justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setUserRole('ALL'); setUserPage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${userRole === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Tất cả</button>
                <button onClick={() => { setUserRole('STUDENT'); setUserPage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${userRole === 'STUDENT' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Học viên</button>
                <button onClick={() => { setUserRole('INSTRUCTOR'); setUserPage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${userRole === 'INSTRUCTOR' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Giảng viên</button>
                <button onClick={() => { setUserRole('ADMIN'); setUserPage(1); }} className={`px-3 py-1 rounded-lg text-sm transition ${userRole === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>Admin</button>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Tìm kiếm người dùng..." value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} className="pl-9 pr-4 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm" />
              </div>
            </div>

            {userLoading ? (
              <div className="text-center py-8 text-gray-400">Đang tải...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Không có người dùng nào</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                      <tr className="text-left text-gray-400">
                        <th className="pb-3">Người dùng</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Vai trò</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3">Ngày tạo</th>
                        <th className="pb-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const isCurrentUser = currentUserId === user.id;
                        const isAdmin = user.role === 'ADMIN';
                        return (
                          <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="text-white">{user.name}</span>
                                {isCurrentUser && <span className="text-xs text-blue-400 ml-2">(Bạn)</span>}
                              </div>
                            </td>
                            <td className="text-gray-300">{user.email}</td>
                            <td>
                              <span className={`px-2 py-1 rounded-lg text-xs ${roleColors[user.role]} bg-transparent`}>
                                {user.role === 'STUDENT' ? 'Học viên' : user.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Admin'}
                              </span>
                            </td>
                            <td>
                              <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                              </span>
                            </td>
                            <td className="text-gray-400 text-sm">{formatDate(user.createdAt)}</td>
                            <td>
                              <div className="flex gap-2">
                                {!isAdmin && !isCurrentUser && (
                                  <button onClick={() => handleToggleUserStatus(user.id)} className="p-1 text-yellow-400 hover:text-yellow-300" title={user.isActive ? 'Khóa' : 'Mở khóa'}>
                                    {user.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                  </button>
                                )}
                                {!isAdmin && !isCurrentUser && (
                                  <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-red-400 hover:text-red-300" title="Xóa">
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {userPagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-50">Trước</button>
                    <span className="px-3 py-1 text-white">Trang {userPage} / {userPagination.totalPages}</span>
                    <button onClick={() => setUserPage(p => Math.min(userPagination.totalPages, p + 1))} disabled={userPage === userPagination.totalPages} className="px-3 py-1 bg-white/10 rounded-lg disabled:opacity-50">Sau</button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        )}

        {/* Instructors Tab */}
        {activeTab === 'instructors' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Giảng viên chờ duyệt
              {pendingInstructors.length > 0 && <span className="ml-2 text-sm text-gray-400">({pendingInstructors.length})</span>}
            </h2>
            {pendingInstructors.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Không có giảng viên nào chờ duyệt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInstructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{instructor.name?.charAt(0).toUpperCase() || 'G'}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{instructor.name}</h3>
                        <p className="text-gray-400 text-sm">{instructor.email}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          Đăng ký: {formatDate(instructor.createdAt)}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleApproveInstructor(instructor.id)} className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Duyệt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
}