'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { MENU_ITEMS, getPermissionsForMenuItem, hasAnyPermission } from '@/lib/permissions';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission, isSuperAdmin, permissions } = useAuth();
  const { isCollapsed, isMobileOpen, toggleSidebar, closeMobileMenu } = useSidebar();

  // Filter menu items based on permissions
  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    // SuperAdmin and Owner see all menu items
    if (isSuperAdmin || user?.role?.name === 'Owner') {
      return true;
    }

    // Check if user has any of the required permissions for this menu item
    const requiredPermissions = getPermissionsForMenuItem(item.name);
    if (requiredPermissions.length === 0) {
      return true; // No permissions required, show to everyone
    }

    return hasAnyPermission(permissions, requiredPermissions);
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`bg-slate-800 text-slate-100 min-h-screen flex flex-col shadow-lg transition-all duration-300 fixed lg:static z-50 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      <div className={`border-b border-slate-700 ${isCollapsed ? 'p-3' : 'p-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">SiBubur</h1>
              <p className="text-sm text-slate-400 mt-1">Point of Sale</p>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full mb-2">
              <h1 className="text-2xl font-bold text-white">S</h1>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center ${isCollapsed ? 'w-full mt-2' : 'ml-2'}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isCollapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-lg transition-all duration-200 group ${
                    isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                  onClick={closeMobileMenu}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`border-t border-slate-700 ${isCollapsed ? 'p-3' : 'p-4'}`}>
        {!isCollapsed && (
          <div className="mb-4">
            <p className="text-sm text-slate-400">Logged in as</p>
            <p className="font-semibold text-white truncate" title={user?.username}>
              {user?.username}
            </p>
          </div>
        )}
        {isCollapsed && (
          <div className="mb-4 flex justify-center">
            <div
              className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center cursor-default"
              title={user?.username || 'User'}
            >
              <span className="text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors text-white font-medium flex items-center justify-center ${
            isCollapsed
              ? 'px-3 py-3'
              : 'px-4 py-2 text-sm'
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          {isCollapsed ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          ) : (
            'Logout'
          )}
        </button>
      </div>
    </div>
    </>
  );
}

