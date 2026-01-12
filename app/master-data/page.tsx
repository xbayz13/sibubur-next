'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function MasterDataPage() {
  const masterDataItems = [
    { name: 'Produk', href: '/master-data/products', icon: '🍲' },
    { name: 'Kategori Produk', href: '/master-data/product-categories', icon: '📁' },
    { name: 'Addon Produk', href: '/master-data/product-addons', icon: '➕' },
    { name: 'Toko', href: '/master-data/stores', icon: '🏪' },
    { name: 'Karyawan', href: '/master-data/employees', icon: '👥' },
    { name: 'Kategori Pengeluaran', href: '/master-data/expense-categories', icon: '💸' },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <BackButton href="/" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Data Master</h1>
            <p className="text-gray-500 dark:text-gray-400">Pengelolaan data master aplikasi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masterDataItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:shadow-theme-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{item.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{item.name}</h3>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

