// frontend/src/components/common/GradientText.jsx
import React from 'react';

export default function GradientText({ children, className = '' }) {
  return (
    <span className={`bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}