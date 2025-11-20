'use client';

import { useState, useEffect } from 'react';
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

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [managingAddons, setManagingAddons] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productsService.getAll(),
        productCategoriesService.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data produk', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan produk', 'error');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) return;

    try {
      await productsService.delete(product.id);
      showToast('Produk berhasil dihapus', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menghapus produk', 'error');
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
          <BackButton href="/master-data" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Produk</h1>
              <p className="text-slate-600">Manajemen data produk</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Tambah Produk
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {products.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Belum ada data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Harga
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Addons
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {product.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          Rp {Number(product.price).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {product.addons && product.addons.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.addons.map((addon) => (
                                <span
                                  key={addon.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                  {addon.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                          {product.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setManagingAddons(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Addons
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="text-rose-600 hover:text-rose-900"
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
          </div>

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
              onUpdate={loadData}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

