'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Kasir', href: '/cashier', icon: '💳' },
  { name: 'Pesanan Terbuka', href: '/open-orders', icon: '🛒' },
  { name: 'Produksi Harian', href: '/productions', icon: '🍲' },
  { name: 'Pesanan', href: '/orders', icon: '📝' },
  { name: 'Transaksi', href: '/transactions', icon: '💰' },
  { name: 'Persediaan', href: '/supplies', icon: '📦' },
  { name: 'Pengeluaran', href: '/expenses', icon: '💸' },
  { name: 'Karyawan', href: '/employees', icon: '👥' },
  { name: 'Laporan', href: '/reports', icon: '📈' },
  { name: 'Data Master', href: '/master-data', icon: '⚙️' },
  { name: 'Pengguna', href: '/users', icon: '👤' },
  { name: 'Role & Izin', href: '/roles', icon: '🔐' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-slate-800 text-slate-100 min-h-screen flex flex-col shadow-lg">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">SiBubur</h1>
        <p className="text-sm text-slate-400 mt-1">Point of Sale</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="mb-4">
          <p className="text-sm text-slate-400">Logged in as</p>
          <p className="font-semibold text-white">{user?.username}</p>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors text-sm text-white font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

