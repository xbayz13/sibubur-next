'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { suppliesService } from '@/lib/services/supplies';
import { Supply } from '@/types';
import SupplyList from '@/components/Supplies/SupplyList';
import RestockModal from '@/components/Supplies/RestockModal';
import SupplyForm from '@/components/Supplies/SupplyForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';

export default function SuppliesPage() {
  const { showToast } = useToast();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [lowStockSupplies, setLowStockSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [filter, setFilter] = useState<'all' | 'low-stock'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadData();
  }, [page, filter, showToast]);

  const loadData = async (pageOverride?: number) => {
    try {
      setLoading(true);
      const pageToLoad = pageOverride ?? page;
      if (pageOverride !== undefined) setPage(pageOverride);
      if (filter === 'low-stock') {
        const lowStock = await suppliesService.getLowStock();
        setLowStockSupplies(lowStock);
        setSupplies([]);
        setTotal(lowStock.length);
        setTotalPages(1);
      } else {
        const res = await suppliesService.getAll({ page: pageToLoad, limit });
        setSupplies(res.data);
        setLowStockSupplies([]);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data persediaan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = (supply: Supply) => {
    setSelectedSupply(supply);
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (quantity: number) => {
    if (!selectedSupply) return;

    try {
      await suppliesService.restock(selectedSupply.id, quantity);
      showToast('Stok berhasil ditambahkan', 'success');
      setShowRestockModal(false);
      setSelectedSupply(null);
      await loadData(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menambahkan stok', 'error');
    }
  };

  const handleCreateSupply = async (supplyData: any) => {
    try {
      await suppliesService.create(supplyData);
      showToast('Persediaan berhasil ditambahkan', 'success');
      setShowSupplyForm(false);
      await loadData(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menambahkan persediaan', 'error');
    }
  };

  const handleUpdateSupply = async (id: number, supplyData: any) => {
    try {
      await suppliesService.update(id, supplyData);
      showToast('Persediaan berhasil diperbarui', 'success');
      await loadData(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memperbarui persediaan', 'error');
    }
  };

  const handleDeleteSupply = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus persediaan ini?')) return;

    try {
      await suppliesService.delete(id);
      showToast('Persediaan berhasil dihapus', 'success');
      await loadData(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus persediaan', 'error');
    }
  };

  const displayedSupplies = filter === 'low-stock' ? lowStockSupplies : supplies;

  useEffect(() => {
    setPage(1);
  }, [filter]);

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Memuat data...</div>
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
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Persediaan</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen stok bahan baku</p>
            </div>
            <Button onClick={() => setShowSupplyForm(true)} size="md">
              + Tambah Persediaan
            </Button>
          </div>

          {/* Low Stock Alert */}
          {lowStockSupplies.length > 0 && (
            <Card className="border-error-200 bg-error-50 dark:bg-error-500/10 dark:border-error-500/20">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-error-900 dark:text-error-400">
                    Peringatan: {lowStockSupplies.length} persediaan dengan stok rendah
                  </h3>
                  <p className="text-sm text-error-700 dark:text-error-500 mt-1">
                    Beberapa persediaan perlu di-restock segera
                  </p>
                </div>
                <Button
                  onClick={() => setFilter('low-stock')}
                  size="sm"
                  className="bg-error-600 hover:bg-error-700"
                >
                  Lihat Stok Rendah
                </Button>
              </div>
            </Card>
          )}

          {/* Filter Tabs */}
          <Card>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Semua Persediaan
              </button>
              <button
                onClick={() => setFilter('low-stock')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'low-stock'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Stok Rendah ({lowStockSupplies.length})
              </button>
            </div>
          </Card>

          <div className="space-y-0">
            <SupplyList
              supplies={displayedSupplies}
              onRestock={handleRestock}
              onUpdate={handleUpdateSupply}
              onDelete={handleDeleteSupply}
            />
            {filter === 'all' && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
              />
            )}
          </div>

          {showRestockModal && selectedSupply && (
            <RestockModal
              supply={selectedSupply}
              onSubmit={handleRestockSubmit}
              onClose={() => {
                setShowRestockModal(false);
                setSelectedSupply(null);
              }}
            />
          )}

          {showSupplyForm && (
            <SupplyForm
              onSubmit={handleCreateSupply}
              onCancel={() => setShowSupplyForm(false)}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
