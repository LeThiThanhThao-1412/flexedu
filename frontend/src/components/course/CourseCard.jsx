// frontend/src/components/course/CourseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  StarIcon, 
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function CourseCard({ course }) {
  const levelColors = {
    BEGINNER: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Cơ bản' },
    INTERMEDIATE: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Trung cấp' },
    ADVANCED: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Nâng cao' },
  };
  const levelStyle = levelColors[course.level] || levelColors.BEGINNER;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link to={`/courses/${course.id}`}>
        <div className="glass-card overflow-hidden card-hover">
          {/* Image Container with Overlay */}
          <div className="relative overflow-hidden h-48">
            <img
              src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Level Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${levelStyle.bg} ${levelStyle.text} backdrop-blur`}>
                {levelStyle.label}
              </span>
            </div>
            
            {/* Price Badge */}
            <div className="absolute bottom-3 right-3">
              <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/20">
                <span className="text-white font-bold">
                  {course.price === 0 ? 'Miễn phí' : `${course.price} USD`}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {course.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {course.description}
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">{course._count?.enrollments || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-gray-400">{course.rating || 0}</span>
                </div>
              </div>
              
              {/* Hover Effect Button */}
              <motion.div
                whileHover={{ x: 5 }}
                className="text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                Chi tiết →
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}