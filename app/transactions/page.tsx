'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { transactionsService } from '@/lib/services/transactions';
import { storesService } from '@/lib/services/stores';
import { Transaction, Store } from '@/types';
import DataTable from '@/components/MasterData/DataTable';
import Pagination from '@/components/ui/Pagination';

export default function TransactionsPage() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Load stores only once on mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const storesRes = await storesService.getAll({ limit: 100 });
        setStores(storesRes.data);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data toko', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadStores();
  }, [showToast]);

  // Load transactions when store filter or page changes (wait for stores to load first)
  useEffect(() => {
    if (stores.length === 0) return;

    const loadTransactions = async () => {
      try {
        setTransactionsLoading(true);
        setTransactions([]);
        const res = await transactionsService.getAll({
          storeId: selectedStoreId,
          page,
          limit,
        });
        setTransactions(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data transaksi', 'error');
        setTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    loadTransactions();
  }, [selectedStoreId, page, stores.length, showToast]);

  useEffect(() => {
    setPage(1);
  }, [selectedStoreId]);

  // Calculate totals (memoized) - totalTransactions uses API total, revenue is sum of current page
  const { totalRevenue, totalTransactions } = useMemo(() => {
    const revenue = transactions.reduce((sum, txn) => sum + Number(txn.amount), 0);
    return { totalRevenue: revenue, totalTransactions: total };
  }, [transactions, total]);

  if (loading && transactions.length === 0) {
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
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Transaksi</h1>
            <p className="text-slate-600">Pencatatan pembayaran pelanggan</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-emerald-700 font-medium">Total Pendapatan</div>
              <div className="text-2xl font-bold text-emerald-900">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-indigo-700 font-medium">Jumlah Transaksi</div>
              <div className="text-2xl font-bold text-indigo-900">{totalTransactions}</div>
            </div>
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

          {/* Transactions Table */}
          {transactionsLoading && transactions.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
              <div className="text-slate-500">Memuat transaksi...</div>
            </div>
          ) : (
            <>
              <DataTable
                data={transactions}
                columns={[
              {
                header: 'No. Transaksi',
                accessor: (transaction) => (
                  <span className="font-mono text-sm">{transaction.transactionNumber || `TXN-${transaction.id}`}</span>
                ),
              },
              {
                header: 'Tanggal',
                accessor: (transaction) => new Date(transaction.createdAt).toLocaleString('id-ID'),
              },
              {
                header: 'No. Pesanan',
                accessor: (transaction) => transaction.order?.orderNumber || '-',
              },
              {
                header: 'Pelanggan',
                accessor: (transaction) => transaction.order?.customerName || '-',
              },
              {
                header: 'Metode Pembayaran',
                accessor: (transaction) => transaction.paymentMethod?.name || '-',
              },
              {
                header: 'Toko',
                accessor: (transaction) => transaction.store?.name || transaction.order?.store?.name || '-',
              },
              {
                header: 'Jumlah',
                accessor: (transaction) => (
                  <span className="font-semibold text-emerald-600">
                    Rp {Number(transaction.amount).toLocaleString('id-ID')}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: (transaction) => (
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      transaction.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {transaction.status === 'paid' ? 'Lunas' : transaction.status}
                  </span>
                ),
              },
            ]}
                keyExtractor={(transaction) => transaction.id}
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
