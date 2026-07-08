'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { productionsService, CreateProductionDto } from '@/lib/services/productions';
import { storesService } from '@/lib/services/stores';
import { suppliesService } from '@/lib/services/supplies';
import { reportsService } from '@/lib/services/reports';
import { Production, Store, Supply } from '@/types';
import ProductionForm from '@/components/Productions/ProductionForm';
import ProductionList from '@/components/Productions/ProductionList';
import Pagination from '@/components/ui/Pagination';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

type ProductionRecommendation = {
  recommendedAmount: number;
  avgSalesForDayOfWeek: number;
  targetWeather?: {
    condition?: string;
    description?: string;
  };
  historicalData: {
    productionCount: number;
    orderCount: number;
    lookbackDays: number;
  };
  weatherMultiplier: number;
  recommendations: string[];
};

export default function ProductionsPage() {
  const { showToast } = useToast();
  const [productions, setProductions] = useState<Production[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  const [recommendations, setRecommendations] = useState<ProductionRecommendation | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Production | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) return response.data.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  // Load stores and supplies only once
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [storesRes, suppliesRes] = await Promise.all([
          storesService.getAll({ limit: 100 }),
          suppliesService.getAll({ limit: 100 }),
        ]);
        setStores(storesRes.data);
        setSupplies(suppliesRes.data);
      } catch (error: unknown) {
        showToast(getErrorMessage(error, 'Gagal memuat data'), 'error');
      }
    };
    loadStaticData();
  }, [showToast]);

  useEffect(() => {
    setPage(1);
  }, [selectedStoreId]);

  // Load productions when filters or page change (wait for stores to load first)
  useEffect(() => {
    if (stores.length === 0) return;

    const loadProductions = async () => {
      try {
        setLoading(true);
        setProductions([]);
        const res = await productionsService.getAll({
          storeId: selectedStoreId,
          page,
          limit,
        });
        setProductions(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (error: unknown) {
        showToast(getErrorMessage(error, 'Gagal memuat data'), 'error');
        setProductions([]);
      } finally {
        setLoading(false);
      }
    };

    loadProductions();
  }, [selectedStoreId, page, stores.length, showToast]);

  useEffect(() => {
    if (selectedDate) {
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedStoreId]);

  const loadRecommendations = async () => {
    try {
      setRecommendationLoading(true);
      const rec = await reportsService.getProductionRecommendations(
        selectedDate,
        selectedStoreId,
        30
      );
      setRecommendations(rec as ProductionRecommendation);
    } catch (error: unknown) {
      // Silently fail - recommendations are optional
      console.warn('Failed to load recommendations:', error);
      setRecommendations(null);
    } finally {
      setRecommendationLoading(false);
    }
  };

  const reloadProductions = useCallback(async (resetToPage1 = false) => {
    try {
      setLoading(true);
      const pageToLoad = resetToPage1 ? 1 : page;
      const res = await productionsService.getAll({
        storeId: selectedStoreId,
        page: pageToLoad,
        limit,
      });
      setProductions(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (resetToPage1) setPage(1);
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal memuat data'), 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, page, limit, showToast]);

  const handleCreateProduction = async (productionData: CreateProductionDto) => {
    try {
      await productionsService.create(productionData);
      showToast('Produksi berhasil dicatat', 'success');
      setShowProductionForm(false);
      await reloadProductions(true); // Reset to page 1 to show newly created production
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal mencatat produksi'), 'error');
    }
  };

  const handleDeleteProduction = async (id: number) => {
    const production = productions.find((p) => p.id === id) || null;
    setDeleteConfirm(production);
  };

  const confirmDeleteProduction = async () => {
    if (!deleteConfirm) return;

    try {
      await productionsService.delete(deleteConfirm.id);
      showToast('Data produksi berhasil dihapus', 'success');
      await reloadProductions(true);
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal menghapus data produksi'), 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500 dark:text-gray-300">Memuat data...</div>
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
              <h1 className="text-3xl font-bold text-slate-800 dark:text-gray-50 mb-2">Produksi Harian</h1>
              <p className="text-slate-600 dark:text-gray-300">
                Pencatatan produksi bubur per toko dengan data cuaca dan persediaan
              </p>
            </div>
            <button
              onClick={() => setShowProductionForm(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors"
            >
              + Catat Produksi Baru
            </button>
          </div>

          {/* Production Recommendations Section - Above Filters */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 border border-indigo-200 dark:border-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-gray-50">Rekomendasi Produksi</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 dark:text-gray-300">Tanggal:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100 rounded-lg px-3 py-1 text-sm"
                />
              </div>
            </div>

            {recommendationLoading ? (
              <div className="text-center py-4 text-slate-600 dark:text-gray-300">Memuat rekomendasi...</div>
            ) : recommendations ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                      Rekomendasi untuk {new Date(selectedDate).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                      {recommendations.recommendedAmount} porsi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                      <div className="text-slate-600 dark:text-gray-300">Rata-rata Penjualan (Hari Sama)</div>
                      <div className="text-lg font-semibold text-slate-800 dark:text-gray-50">
                        {recommendations.avgSalesForDayOfWeek} porsi
                      </div>
                    </div>
                    {recommendations.targetWeather && (
                      <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                        <div className="text-slate-600 dark:text-gray-300">Cuaca</div>
                        <div className="text-lg font-semibold text-slate-800 dark:text-gray-50 capitalize">
                          {recommendations.targetWeather.condition}
                          {recommendations.targetWeather.description && (
                            <span className="text-sm font-normal text-slate-600 dark:text-gray-300 ml-2">
                              ({recommendations.targetWeather.description})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                      <div className="text-slate-600 dark:text-gray-300">Data Historis</div>
                      <div className="text-sm text-slate-700 dark:text-gray-100">
                        {recommendations.historicalData.productionCount} produksi, {recommendations.historicalData.orderCount} pesanan
                        <br />
                        <span className="text-xs text-slate-500 dark:text-gray-400">
                          (dari {recommendations.historicalData.lookbackDays} hari terakhir)
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                      <div className="text-slate-600 dark:text-gray-300">Pengali Cuaca</div>
                      <div className="text-lg font-semibold text-slate-800 dark:text-gray-50">
                        {(recommendations.weatherMultiplier * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-100 dark:border-gray-800">
                  <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Detail Rekomendasi:</h4>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-gray-100">
                    {recommendations.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-500 dark:text-indigo-300 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 dark:text-gray-400">
                Tidak ada rekomendasi tersedia. Pastikan ada data historis produksi dan penjualan.
              </div>
            )}
          </div>

          {/* Filters - Below Recommendations */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                  Filter Toko
                </label>
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined);
                  }}
                  className="w-full border border-slate-300 dark:border-gray-700 rounded-lg px-4 py-2 text-slate-900 dark:text-gray-100 bg-white dark:bg-gray-900"
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

          <div className="space-y-0">
            <ProductionList
              productions={productions}
              onDelete={handleDeleteProduction}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>

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

           <ConfirmationModal
             isOpen={!!deleteConfirm}
             title="Hapus Data Produksi?"
             message="Hapus data produksi ini?"
             confirmText="Ya, Hapus"
             cancelText="Batal"
             onConfirm={confirmDeleteProduction}
             onCancel={() => setDeleteConfirm(null)}
             variant="danger"
           />
         </div>
       </MainLayout>
     </ProtectedRoute>
   );
 }
