'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';

export default function ProductionsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Produksi Harian</h1>
            <p className="text-gray-600">Pencatatan produksi bubur per toko dengan data cuaca</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">Halaman produksi harian akan dikembangkan di sini</p>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

