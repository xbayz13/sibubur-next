'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';

export default function Home() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">Selamat datang di sistem SiBubur POS</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Penjualan Hari Ini</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">Rp 0</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pesanan Hari Ini</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div className="text-3xl">📝</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produksi Hari Ini</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div className="text-3xl">🍲</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Persediaan Rendah</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div className="text-3xl">⚠️</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Aktivitas Terkini</h2>
            <p className="text-gray-500">Tidak ada aktivitas terkini</p>
        </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
