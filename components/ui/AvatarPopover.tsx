'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarPopoverProps {
  isExpanded: boolean;
}

export default function AvatarPopover({ isExpanded }: AvatarPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full group focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center shrink-0 transition-transform group-active:scale-95 shadow-theme-sm">
          <span className="text-white font-semibold text-sm">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        
        {isExpanded && (
          <div className="flex flex-col items-start overflow-hidden">
            <span className="font-semibold text-gray-800 dark:text-white truncate w-full text-left">
              {user?.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-left">
              {user?.role?.name || 'User'}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div 
          className={`absolute bottom-full mb-2 z-50 min-w-[160px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-theme-xl p-2 animate-slide-in ${
            isExpanded ? 'left-0' : 'left-0 ml-12'
          }`}
          role="menu"
        >
          <div className="px-3 py-2 mb-2 border-b border-gray-100 dark:border-gray-800 lg:hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">User Info</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
          </div>
          
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </Link>
          
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors text-left"
            role="menuitem"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
