// frontend/src/components/common/GlassCard.jsx
import React from 'react';

export default function GlassCard({ children, className = '' }) {
  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}