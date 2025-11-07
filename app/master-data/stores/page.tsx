'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { storesService } from '@/lib/services/stores';
import { Store } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import StoreForm from '@/components/MasterData/StoreForm';

export default function StoresPage() {
  const { showToast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await storesService.getAll();
      setStores(data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data toko', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStore(null);
    setShowForm(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setShowForm(true);
  };

  const handleSubmit = async (storeData: { name: string }) => {
    try {
      if (editingStore) {
        await storesService.update(editingStore.id, storeData);
        showToast('Toko berhasil diperbarui', 'success');
      } else {
        await storesService.create(storeData);
        showToast('Toko berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingStore(null);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan toko', 'error');
    }
  };

  const handleDelete = async (store: Store) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus toko "${store.name}"?`)) return;

    try {
      await storesService.delete(store.id);
      showToast('Toko berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus toko', 'error');
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Toko</h1>
              <p className="text-slate-600">Manajemen data toko</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Tambah Toko
            </button>
          </div>

          <DataTable
            data={stores}
            columns={[
              { header: 'Nama', accessor: 'name' },
              {
                header: 'Tanggal Dibuat',
                accessor: (item) =>
                  item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('id-ID')
                    : '-',
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            keyExtractor={(item) => item.id}
          />

          {showForm && (
            <StoreForm
              store={editingStore}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingStore(null);
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

