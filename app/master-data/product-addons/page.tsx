'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { productAddonsService } from '@/lib/services/product-addons';
import { ProductAddon } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import AddonForm from '@/components/MasterData/AddonForm';
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

export default function ProductAddonsPage() {
  const { showToast } = useToast();
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProductAddon | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productAddonsService.getAll({ page, limit });
      setAddons(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal memuat data addon');
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [limit, page, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingAddon(null);
    setShowForm(true);
  };

  const handleEdit = (addon: ProductAddon) => {
    setEditingAddon(addon);
    setShowForm(true);
  };

  const handleSubmit = async (addonData: { name: string; price: number; description?: string }) => {
    try {
      if (editingAddon) {
        await productAddonsService.update(editingAddon.id, addonData);
        showToast('Addon berhasil diperbarui', 'success');
      } else {
        await productAddonsService.create(addonData);
        showToast('Addon berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingAddon(null);
      await loadData();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal menyimpan addon');
      showToast(message, 'error');
    }
  };

  const handleDelete = async (addon: ProductAddon) => {
    setDeleteConfirm(addon);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await productAddonsService.delete(deleteConfirm.id);
      showToast('Addon berhasil dihapus', 'success');
      await loadData();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal menghapus addon');
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
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Addon Produk</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen addon produk</p>
            </div>
            <Button onClick={handleCreate} size="md">
              + Tambah Addon
            </Button>
          </div>

          <DataTable
            data={addons}
            columns={[
              { header: 'Nama', accessor: 'name' },
              {
                header: 'Harga',
                accessor: (item) => `Rp ${Number(item.price).toLocaleString('id-ID')}`,
              },
              {
                header: 'Deskripsi',
                accessor: (item) => item.description || '-',
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
            <AddonForm
              key={editingAddon?.id ?? 'new-addon'}
              addon={editingAddon}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingAddon(null);
              }}
            />
          )}

           <ConfirmationModal
             isOpen={!!deleteConfirm}
             title="Hapus Addon Produk?"
             message={`Hapus addon "${deleteConfirm?.name}"?`}
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
