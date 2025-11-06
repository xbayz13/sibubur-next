'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan</h1>
            <p className="text-gray-600">Laporan harian, bulanan, dan tahunan dengan rekomendasi produksi</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">Halaman laporan akan dikembangkan di sini</p>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

