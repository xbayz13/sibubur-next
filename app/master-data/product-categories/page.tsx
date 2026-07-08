'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { productCategoriesService } from '@/lib/services/product-categories';
import { ProductCategory } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import CategoryForm from '@/components/MasterData/CategoryForm';
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

export default function ProductCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProductCategory | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productCategoriesService.getAll({ page, limit });
      setCategories(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal memuat data kategori');
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [limit, page, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSubmit = async (categoryData: { name: string; description?: string }) => {
    try {
      if (editingCategory) {
        await productCategoriesService.update(editingCategory.id, categoryData);
        showToast('Kategori berhasil diperbarui', 'success');
      } else {
        await productCategoriesService.create(categoryData);
        showToast('Kategori berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingCategory(null);
      await loadData();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal menyimpan kategori');
      showToast(message, 'error');
    }
  };

  const handleDelete = async (category: ProductCategory) => {
    setDeleteConfirm(category);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await productCategoriesService.delete(deleteConfirm.id);
      showToast('Kategori berhasil dihapus', 'success');
      await loadData();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Gagal menghapus kategori');
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
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Kategori Produk</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen kategori produk</p>
            </div>
            <Button onClick={handleCreate} size="md">
              + Tambah Kategori
            </Button>
          </div>

          <DataTable
            data={categories}
            columns={[
              { header: 'Nama', accessor: 'name' },
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
            <CategoryForm
              key={editingCategory?.id ?? 'new-product-category'}
              category={editingCategory}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCategory(null);
               }}
             />
           )}

           <ConfirmationModal
             isOpen={!!deleteConfirm}
             title="Hapus Kategori Produk?"
             message={`Hapus kategori "${deleteConfirm?.name}"?`}
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
