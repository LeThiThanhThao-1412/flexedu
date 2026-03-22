// frontend/src/components/common/Button.jsx
import React from 'react';

export const PrimaryButton = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl 
        hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 
        shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export const SecondaryButton = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl 
        hover:bg-white/20 transform hover:scale-105 transition-all duration-300 ${className}`}
    >
      {children}
    </button>
  );
};