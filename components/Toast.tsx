'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} border px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md z-50 animate-slide-in`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 font-bold text-lg"
      >
        ×
      </button>
    </div>
  );
}

