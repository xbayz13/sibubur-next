'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { storesService } from '@/lib/services/stores';
import { Store } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import StoreForm from '@/components/MasterData/StoreForm';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    if (apiError.response?.data?.message) return apiError.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function StoresPage() {
  const { showToast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Store | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await storesService.getAll({ page, limit });
      setStores(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal memuat data toko');
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [limit, page, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal menyimpan toko');
      showToast(message, 'error');
    }
  };

  const handleDelete = async (store: Store) => {
    setDeleteConfirm(store);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await storesService.delete(deleteConfirm.id);
      showToast('Toko berhasil dihapus', 'success');
      await loadData();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal menghapus toko');
      showToast(message, 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

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
          <BackButton href="/master-data" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Toko</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen data toko</p>
            </div>
            <Button onClick={handleCreate} size="md">
              + Tambah Toko
            </Button>
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
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />

          {showForm && (
            <StoreForm
              key={editingStore?.id ?? 'new-store'}
              store={editingStore}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                 setEditingStore(null);
               }}
             />
           )}

           <ConfirmationModal
             isOpen={!!deleteConfirm}
             title="Hapus Toko?"
             message={`Hapus toko "${deleteConfirm?.name}"?`}
             confirmText="Ya, Hapus"
             cancelText="Batal"
             onConfirm={confirmDelete}
             onCancel={() => setDeleteConfirm(null)}
             variant="danger"
           />
         </div>
       </MainLayout>
     </ProtectedRoute>
   );
 }
