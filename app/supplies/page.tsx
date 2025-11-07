'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { suppliesService } from '@/lib/services/supplies';
import { Supply } from '@/types';
import SupplyList from '@/components/Supplies/SupplyList';
import RestockModal from '@/components/Supplies/RestockModal';
import SupplyForm from '@/components/Supplies/SupplyForm';

export default function SuppliesPage() {
  const { showToast } = useToast();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [lowStockSupplies, setLowStockSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [filter, setFilter] = useState<'all' | 'low-stock'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allSupplies, lowStock] = await Promise.all([
        suppliesService.getAll(),
        suppliesService.getLowStock(),
      ]);

      setSupplies(allSupplies);
      setLowStockSupplies(lowStock);
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
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menambahkan stok', 'error');
    }
  };

  const handleCreateSupply = async (supplyData: any) => {
    try {
      await suppliesService.create(supplyData);
      showToast('Persediaan berhasil ditambahkan', 'success');
      setShowSupplyForm(false);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menambahkan persediaan', 'error');
    }
  };

  const handleUpdateSupply = async (id: number, supplyData: any) => {
    try {
      await suppliesService.update(id, supplyData);
      showToast('Persediaan berhasil diperbarui', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memperbarui persediaan', 'error');
    }
  };

  const handleDeleteSupply = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus persediaan ini?')) return;

    try {
      await suppliesService.delete(id);
      showToast('Persediaan berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus persediaan', 'error');
    }
  };

  const displayedSupplies = filter === 'low-stock' ? lowStockSupplies : supplies;

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Persediaan</h1>
              <p className="text-slate-600">Manajemen stok bahan baku</p>
            </div>
            <button
              onClick={() => setShowSupplyForm(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Tambah Persediaan
            </button>
          </div>

          {/* Low Stock Alert */}
          {lowStockSupplies.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-rose-900">
                    Peringatan: {lowStockSupplies.length} persediaan dengan stok rendah
                  </h3>
                  <p className="text-sm text-rose-700 mt-1">
                    Beberapa persediaan perlu di-restock segera
                  </p>
                </div>
                <button
                  onClick={() => setFilter('low-stock')}
                  className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Lihat Stok Rendah
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semua Persediaan
              </button>
              <button
                onClick={() => setFilter('low-stock')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'low-stock'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Stok Rendah ({lowStockSupplies.length})
              </button>
            </div>
          </div>

          <SupplyList
            supplies={displayedSupplies}
            onRestock={handleRestock}
            onUpdate={handleUpdateSupply}
            onDelete={handleDeleteSupply}
          />

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
