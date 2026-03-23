// frontend/src/App.jsx (thêm các route mới)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import CoursesPage from './pages/CoursesPage';
import LessonPlayer from './components/learning/LessonPlayer';
import CourseDetailPage from './pages/CourseDetailPage';
import LearningPage from './pages/LearningPage';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateCoursePage from './pages/CreateCoursePage';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        {/* THÊM ROUTE NÀY VÀO */}
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
        {/* Protected Routes - Student */}
        <Route path="/my-learning" element={
          <ProtectedRoute>
            <div className="pt-16 min-h-screen flex items-center justify-center">
              <div className="text-white">Trang học tập (đang phát triển)</div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/learning/:courseId" element={
          <ProtectedRoute>
            <LearningPage />
          </ProtectedRoute>
        } />
        {/* Checkout - Trang thanh toán */}
        <Route path="/checkout/:courseId?" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        <Route path="/instructor/courses/create" element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <CreateCoursePage />
          </ProtectedRoute>
        } />
        {/* Instructor Routes */}
        <Route path="/instructor/courses" element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <InstructorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/lessons/:lessonId" element={<LessonPlayer />} />
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;