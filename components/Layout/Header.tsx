'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">SiBubur POS System</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.role?.name || 'User'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

