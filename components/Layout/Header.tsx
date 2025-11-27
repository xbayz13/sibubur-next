'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Header() {
  const { user } = useAuth();
  const { toggleMobileMenu } = useSidebar();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleOrientationChange = () => {
      // Check current orientation
      const orientation = (screen as any).orientation;
      if (orientation && orientation.angle !== undefined) {
        setIsLandscape(
          orientation.angle === 90 || orientation.angle === -90 || orientation.angle === 270
        );
      } else {
        // Fallback for browsers without Screen Orientation API
        setIsLandscape(window.innerWidth > window.innerHeight);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Initial check
    handleOrientationChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) {
          await (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const toggleScreenRotation = async () => {
    try {
      const orientation = (screen as any).orientation;
      
      if (!orientation) {
        // Fallback: Show message if Screen Orientation API is not supported
        alert('Rotasi layar tidak didukung di browser ini. Silakan gunakan rotasi otomatis perangkat.');
        return;
      }

      // Check if we can lock orientation
      if (orientation.lock) {
        if (isLandscape) {
          // Switch to portrait
          await orientation.lock('portrait');
          setIsLandscape(false);
        } else {
          // Switch to landscape
          await orientation.lock('landscape');
          setIsLandscape(true);
        }
      } else {
        // Fallback: Try to unlock and let device handle it
        if (orientation.unlock) {
          orientation.unlock();
        }
        alert('Rotasi layar tidak dapat dikunci. Silakan gunakan rotasi otomatis perangkat.');
      }
    } catch (error: any) {
      // Some browsers require fullscreen mode to lock orientation
      if (error.name === 'NotSupportedError' || error.name === 'SecurityError') {
        alert('Rotasi layar memerlukan mode fullscreen. Silakan aktifkan fullscreen terlebih dahulu.');
      } else {
        console.error('Error toggling screen rotation:', error);
        alert('Gagal memutar layar. Silakan coba lagi.');
      }
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center">
            <img
              src="/sibubur-high-resolution-logo-transparent.png"
              alt="SiBubur Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Rotate Screen Button */}
          <button
            onClick={toggleScreenRotation}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={isLandscape ? 'Rotate to portrait' : 'Rotate to landscape'}
            title={isLandscape ? 'Putar ke portrait' : 'Putar ke landscape'}
          >
            <svg
              className="w-5 h-5 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                transform={isLandscape ? 'rotate(90 12 12)' : ''}
              />
            </svg>
          </button>
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Keluar dari fullscreen' : 'Masuk ke fullscreen'}
          >
            {isFullscreen ? (
              <svg
                className="w-5 h-5 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{user?.username}</p>
            <p className="text-xs text-slate-500">{user?.role?.name || 'User'}</p>
          </div>
          <div className="sm:hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

