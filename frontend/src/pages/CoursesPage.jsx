// frontend/src/pages/CoursesPage.jsx
import React, { useState, useEffect } from 'react';
import { courseService } from '../services/course.service';
import CourseCard from '../components/course/CourseCard';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    level: '',
    search: '',
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getCourses(filters);
      setCourses(response.data.courses || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleLevelChange = (level) => {
    setFilters({ ...filters, level: level === filters.level ? '' : level, page: 1 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tất cả khóa học</h1>
      
      {/* Search and Filter */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tìm kiếm
          </button>
        </form>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleLevelChange('BEGINNER')}
            className={`px-4 py-2 rounded-lg ${
              filters.level === 'BEGINNER'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cơ bản
          </button>
          <button
            onClick={() => handleLevelChange('INTERMEDIATE')}
            className={`px-4 py-2 rounded-lg ${
              filters.level === 'INTERMEDIATE'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Trung cấp
          </button>
          <button
            onClick={() => handleLevelChange('ADVANCED')}
            className={`px-4 py-2 rounded-lg ${
              filters.level === 'ADVANCED'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Nâng cao
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Không tìm thấy khóa học nào</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2">
                Trang {filters.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === pagination.totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}