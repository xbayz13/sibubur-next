'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { productionsService, CreateProductionDto } from '@/lib/services/productions';
import { storesService } from '@/lib/services/stores';
import { suppliesService } from '@/lib/services/supplies';
import { weatherService } from '@/lib/services/weather';
import { reportsService } from '@/lib/services/reports';
import { Production, Store, Supply, Weather } from '@/types';
import ProductionForm from '@/components/Productions/ProductionForm';
import ProductionList from '@/components/Productions/ProductionList';

export default function ProductionsPage() {
  const { showToast } = useToast();
  const [productions, setProductions] = useState<Production[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Load stores and supplies only once
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [storesData, suppliesData] = await Promise.all([
          storesService.getAll(),
          suppliesService.getAll(),
        ]);
        setStores(storesData);
        setSupplies(suppliesData);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data', 'error');
      }
    };
    if (stores.length === 0) {
      loadStaticData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load productions when filters change
  useEffect(() => {
    const loadProductions = async () => {
      try {
        setLoading(true);
        // Clear productions first to show loading state
        setProductions([]);
        const productionsData = await productionsService.getAll(
          selectedStoreId
        );
        setProductions(productionsData);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data', 'error');
        setProductions([]);
      } finally {
        setLoading(false);
      }
    };

    loadProductions();
  }, [selectedStoreId, showToast]);

  useEffect(() => {
    if (selectedDate && selectedStoreId) {
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedStoreId]);

  const loadRecommendations = async () => {
    try {
      const rec = await reportsService.getProductionRecommendations(
        selectedDate,
        selectedStoreId,
        30
      );
      setRecommendations(rec);
    } catch (error: any) {
      // Silently fail - recommendations are optional
      console.warn('Failed to load recommendations:', error);
    }
  };

  const reloadProductions = useCallback(async () => {
    try {
      setLoading(true);
      const productionsData = await productionsService.getAll(
        selectedStoreId
      );
      setProductions(productionsData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, showToast]);

  const handleCreateProduction = async (productionData: CreateProductionDto) => {
    try {
      await productionsService.create(productionData);
      showToast('Produksi berhasil dicatat', 'success');
      setShowProductionForm(false);
      await reloadProductions();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal mencatat produksi', 'error');
    }
  };

  const handleDeleteProduction = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data produksi ini?')) return;

    try {
      await productionsService.delete(id);
      showToast('Data produksi berhasil dihapus', 'success');
      await reloadProductions();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus data produksi', 'error');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Memuat data...</div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <BackButton href="/" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Produksi Harian</h1>
              <p className="text-slate-600">
                Pencatatan produksi bubur per toko dengan data cuaca dan persediaan
              </p>
            </div>
            <button
              onClick={() => setShowProductionForm(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Catat Produksi Baru
            </button>
          </div>

          {recommendations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Rekomendasi Produksi untuk {new Date(selectedDate).toLocaleDateString('id-ID')}
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                {recommendations.recommendations.map((rec: string, idx: number) => (
                  <p key={idx}>• {rec}</p>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <span className="text-lg font-bold text-blue-900">
                  Jumlah yang Direkomendasikan: {recommendations.recommendedAmount} porsi
                </span>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter Toko
                </label>
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 bg-white"
                >
                  <option value="">Semua Toko</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>

          <ProductionList
            productions={productions}
            onDelete={handleDeleteProduction}
          />

          {showProductionForm && (
            <ProductionForm
              stores={stores}
              supplies={supplies}
              defaultStoreId={selectedStoreId}
              defaultDate={selectedDate}
              recommendations={recommendations}
              onSubmit={handleCreateProduction}
              onCancel={() => setShowProductionForm(false)}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
