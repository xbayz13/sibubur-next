'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { productsService } from '@/lib/services/products';
import { productCategoriesService } from '@/lib/services/product-categories';
import { Product, ProductCategory } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import ProductForm from '@/components/MasterData/ProductForm';
import ProductAddonsManager from '@/components/MasterData/ProductAddonsManager';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [managingAddons, setManagingAddons] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const pageRef = useRef(page);
  pageRef.current = page;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Load categories once on mount (for dropdown)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await productCategoriesService.getAll({ limit: 100 });
        setCategories(res.data);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data kategori', 'error');
      }
    };
    loadCategories();
  }, [showToast]);

  const loadProducts = useCallback(async (pageToLoad?: number) => {
    try {
      setLoading(true);
      const p = pageToLoad ?? pageRef.current;
      const res = await productsService.getAll({ page: p, limit });
      setProducts(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (pageToLoad !== undefined) setPage(pageToLoad);
    } catch (error: any) {
      showToastRef.current(error.response?.data?.message || 'Gagal memuat data produk', 'error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadProducts(page);
  }, [page, loadProducts]);

  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (productData: any) => {
    try {
      if (editingProduct) {
        await productsService.update(editingProduct.id, productData);
        showToast('Produk berhasil diperbarui', 'success');
      } else {
        await productsService.create(productData);
        showToast('Produk berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setEditingProduct(null);
      await loadProducts(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan produk', 'error');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) return;

    try {
      await productsService.delete(product.id);
      showToast('Produk berhasil dihapus', 'success');
      await loadProducts(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus produk', 'error');
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
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">Produk</h1>
              <p className="text-gray-500 dark:text-gray-400">Manajemen data produk</p>
            </div>
            <Button onClick={handleCreate} size="md">
              + Tambah Produk
            </Button>
          </div>

          <Card>
            {products.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Belum ada data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Harga
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Addons
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                          {product.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white/90">
                          Rp {Number(product.price).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                          {product.addons && product.addons.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.addons.map((addon) => (
                                <span
                                  key={addon.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-400"
                                >
                                  {addon.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-white/90 max-w-xs truncate">
                          {product.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setManagingAddons(product)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Addons
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </Card>

          {showForm && (
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            />
          )}

          {managingAddons && (
            <ProductAddonsManager
              product={managingAddons}
              onClose={() => setManagingAddons(null)}
              onUpdate={loadProducts}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

