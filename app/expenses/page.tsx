'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { expensesService, CreateExpenseDto, UpdateExpenseDto } from '@/lib/services/expenses';
import { expenseCategoriesService } from '@/lib/services/expense-categories';
import { storesService } from '@/lib/services/stores';
import { Expense, ExpenseCategory, Store } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import Pagination from '@/components/ui/Pagination';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Load categories and stores only once
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [categoriesRes, storesRes] = await Promise.all([
          expenseCategoriesService.getAll({ limit: 100 }),
          storesService.getAll({ limit: 100 }),
        ]);
        setCategories(categoriesRes.data);
        setStores(storesRes.data);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Gagal memuat data';
        showToast(message, 'error');
      }
    };
    loadStaticData();
  }, [showToast]);

  // Load expenses when store filter or page changes (wait for stores to load first)
  useEffect(() => {
    if (stores.length === 0) return;

    const loadExpenses = async () => {
      try {
        setLoading(true);
        setExpenses([]);
        const res = await expensesService.getAll({
          storeId: selectedStoreId,
          page,
          limit,
        });
        setExpenses(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Gagal memuat data pengeluaran';
        showToast(message, 'error');
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };
    loadExpenses();
  }, [selectedStoreId, page, stores.length, showToast]);

  useEffect(() => {
    setPage(1);
  }, [selectedStoreId]);

  const reloadExpenses = async (pageOverride?: number) => {
    try {
      const pageToLoad = pageOverride ?? page;
      const res = await expensesService.getAll({
        storeId: selectedStoreId,
        page: pageToLoad,
        limit,
      });
      setExpenses(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (pageOverride !== undefined) setPage(pageOverride);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memuat data pengeluaran';
      showToast(message, 'error');
      setExpenses([]);
    }
  };

  const handleCreate = () => {
    setSelectedExpense(null);
    setShowForm(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expense: Expense) => {
    setDeleteConfirm(expense);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await expensesService.delete(deleteConfirm.id);
      showToast('Pengeluaran berhasil dihapus', 'success');
      await reloadExpenses(1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus pengeluaran';
      showToast(message, 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSubmit = async (data: CreateExpenseDto | UpdateExpenseDto) => {
    try {
      if (selectedExpense) {
        await expensesService.update(selectedExpense.id, data as UpdateExpenseDto);
        showToast('Pengeluaran berhasil diperbarui', 'success');
      } else {
        await expensesService.create(data as CreateExpenseDto);
        showToast('Pengeluaran berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      setSelectedExpense(null);
      await reloadExpenses(1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan pengeluaran';
      showToast(message, 'error');
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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Pengeluaran</h1>
              <p className="text-slate-600">Pencatatan pengeluaran operasional</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              Tambah Pengeluaran
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter Toko
              </label>
              <select
                value={selectedStoreId || ''}
                onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              >
                <option value="">Semua Toko</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <DataTable
              data={expenses}
              columns={[
              {
                header: 'Tanggal',
                accessor: (expense) => new Date(expense.createdAt).toLocaleDateString('id-ID'),
              },
              {
                header: 'Kategori',
                accessor: (expense) => expense.category?.name || '-',
              },
              {
                header: 'Toko',
                accessor: (expense) => expense.store?.name || '-',
              },
              {
                header: 'Jumlah',
                accessor: (expense) => `Rp ${Number(expense.totalAmount).toLocaleString('id-ID')}`,
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            keyExtractor={(expense) => expense.id}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>

          {/* Form Modal */}
          {showForm && (
            <ExpenseForm
              expense={selectedExpense}
              categories={categories}
              stores={stores}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setSelectedExpense(null);
              }}
            />
          )}
         </div>

         <ConfirmationModal
           isOpen={!!deleteConfirm}
           title="Hapus Pengeluaran?"
           message="Hapus pengeluaran ini?"
           confirmText="Ya, Hapus"
           cancelText="Batal"
           onConfirm={confirmDelete}
           onCancel={() => setDeleteConfirm(null)}
           variant="danger"
         />
       </MainLayout>
     </ProtectedRoute>
   );
 }

 interface ExpenseFormProps {
  expense: Expense | null;
  categories: ExpenseCategory[];
  stores: Store[];
  onSubmit: (data: CreateExpenseDto | UpdateExpenseDto) => void;
  onCancel: () => void;
}

function ExpenseForm({ expense, categories, stores, onSubmit, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<CreateExpenseDto>({
    expenseCategoryId: expense?.expenseCategoryId || 0,
    storeId: expense?.storeId || 0,
    totalAmount: expense?.totalAmount || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expenseCategoryId || !formData.storeId || formData.totalAmount <= 0) {
      alert('Harap lengkapi semua field');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-slate-800">
          {expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kategori
            </label>
            <select
              value={formData.expenseCategoryId}
              onChange={(e) =>
                setFormData({ ...formData, expenseCategoryId: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Toko
            </label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
            >
              <option value="">Pilih Toko</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jumlah (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) =>
                setFormData({ ...formData, totalAmount: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
