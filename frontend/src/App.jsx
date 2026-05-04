// frontend/src/App.jsx
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
import ManageContentPage from './pages/ManageContentPage';
import EditCoursePage from './pages/EditCoursePage';
import LessonPlayer from './components/learning/LessonPlayer';
import CourseDetailPage from './pages/CourseDetailPage';
import LearningPage from './pages/LearningPage';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateCoursePage from './pages/CreateCoursePage';
import MyLearningPage from './pages/MyLearningPage';

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
        
        {/* Instructor Dashboard */}
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
        
        {/* Student Routes - My Learning */}
        <Route path="/my-learning" element={
          <ProtectedRoute>
            <MyLearningPage />
          </ProtectedRoute>
        } />
        
        {/* Learning Page */}
        <Route path="/learning/:courseId" element={
          <ProtectedRoute>
            <LearningPage />
          </ProtectedRoute>
        } />
        
        {/* Checkout - Payment */}
        <Route path="/checkout/:courseId?" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        
        {/* Instructor Course Management */}
        <Route path="/instructor/courses/create" element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <CreateCoursePage />
          </ProtectedRoute>
        } />
        
        <Route path="/instructor/courses/:id/edit" element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <EditCoursePage />
          </ProtectedRoute>
        } />
        
        <Route path="/instructor/courses" element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <InstructorDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/instructor/courses/:courseId/content" element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <ManageContentPage />
          </ProtectedRoute>
        } />
        
        {/* Lesson Player - Public for free lessons, Protected for paid */}
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