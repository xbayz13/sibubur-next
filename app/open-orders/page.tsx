'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import { useToast } from '@/components/ToastContainer';
import { ordersService } from '@/lib/services/orders';
import { storesService } from '@/lib/services/stores';
import { transactionsService, CreateTransactionDto } from '@/lib/services/transactions';
import { paymentMethodsService } from '@/lib/services/payment-methods';
import { Order, Store, PaymentMethod } from '@/types';
import Link from 'next/link';

export default function OpenOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadStores();
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores]);

  useEffect(() => {
    if (selectedStoreId) {
      loadOrders();
    }
  }, [selectedStoreId]);

  const loadStores = async () => {
    try {
      const storesData = await storesService.getAll();
      setStores(storesData);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data toko', 'error');
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentMethodsService.getAll();
      setPaymentMethods(methods);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const loadOrders = async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    try {
      const ordersData = await ordersService.getAll(selectedStoreId);
      const openOrders = ordersData.filter((o) => o.status === 'open');
      setOrders(openOrders);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat pesanan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by search query (orderNumber or customerName)
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) {
      return orders;
    }

    const query = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      const orderNumberMatch = order.orderNumber.toLowerCase().includes(query);
      const customerNameMatch = order.customerName
        ?.toLowerCase()
        .includes(query);
      return orderNumberMatch || customerNameMatch;
    });
  }, [orders, searchQuery]);

  const handlePayOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (
    paymentMethodId: number,
    amount: number
  ) => {
    if (!selectedOrder || !selectedStoreId) return;

    try {
      const transactionData: CreateTransactionDto = {
        orderId: selectedOrder.id,
        paymentMethodId,
        amount,
        storeId: selectedStoreId,
      };

      await transactionsService.create(transactionData);
      showToast('Pembayaran berhasil diproses', 'success');
      setShowPaymentModal(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Gagal memproses pembayaran',
        'error'
      );
      console.error('Error processing payment:', error);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Pesanan Terbuka</h1>
              <p className="text-slate-600 mt-1">
                Kelola pesanan yang belum dibayar
              </p>
            </div>
            <Link
              href="/cashier"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Ke Kasir
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Toko
                </label>
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cari (Nomor Pesanan atau Nama Pelanggan)
                </label>
                <input
                  type="text"
                  placeholder="Cari pesanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-slate-600">Memuat pesanan...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 text-lg">
                  {searchQuery
                    ? 'Tidak ada pesanan yang sesuai dengan pencarian'
                    : 'Belum ada pesanan terbuka'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Nomor Pesanan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Pajak
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Waktu
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            {order.orderNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {order.customerName || (
                              <span className="text-slate-400">Tanpa Nama</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {order.orderItems.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{' '}
                            item
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            Rp{' '}
                            {Number(order.subtotalAmount).toLocaleString(
                              'id-ID'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            Rp {Number(order.taxAmount).toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-emerald-600">
                            Rp{' '}
                            {Number(order.totalAmount).toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">
                            {new Date(order.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/orders/${order.id}`}
                              className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
                            >
                              Detail
                            </Link>
                            <button
                              onClick={() => handlePayOrder(order)}
                              className="text-emerald-600 hover:text-emerald-900 px-3 py-1 rounded hover:bg-emerald-50 transition-colors font-semibold"
                            >
                              Bayar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredOrders.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Menampilkan {filteredOrders.length} dari {orders.length}{' '}
                    pesanan terbuka
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    Total: Rp{' '}
                    {filteredOrders
                      .reduce(
                        (sum, order) => sum + Number(order.totalAmount),
                        0
                      )
                      .toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedOrder && (
          <PaymentModal
            order={selectedOrder}
            paymentMethods={paymentMethods}
            onProcess={handleProcessPayment}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedOrder(null);
            }}
          />
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}

// Payment Modal Component
interface PaymentModalProps {
  order: Order;
  paymentMethods: PaymentMethod[];
  onProcess: (paymentMethodId: number, amount: number) => void;
  onClose: () => void;
}

function PaymentModal({
  order,
  paymentMethods,
  onProcess,
  onClose,
}: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    number | null
  >(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  const numericTotal =
    typeof order.totalAmount === 'string'
      ? parseFloat(order.totalAmount)
      : Number(order.totalAmount);

  // Get selected payment method details
  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
  const isCash = selectedMethod?.name?.toLowerCase().includes('cash') || false;

  // Auto-set amount for non-cash payment methods
  useEffect(() => {
    if (selectedPaymentMethod && !isCash) {
      setAmountPaid(numericTotal.toString());
    } else if (!selectedPaymentMethod) {
      setAmountPaid('');
    }
  }, [selectedPaymentMethod, isCash, numericTotal]);

  useEffect(() => {
    if (amountPaid && selectedPaymentMethod) {
      const paid = parseFloat(amountPaid) || 0;
      setChange(Math.max(0, paid - numericTotal));
    } else {
      setChange(0);
    }
  }, [amountPaid, numericTotal, selectedPaymentMethod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentMethod) {
      alert('Pilih metode pembayaran');
      return;
    }
    const paid = parseFloat(amountPaid) || 0;
    if (paid < numericTotal) {
      alert('Jumlah pembayaran kurang');
      return;
    }
    onProcess(selectedPaymentMethod, paid);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Pembayaran</h2>
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600">Nomor Pesanan</div>
          <div className="text-lg font-semibold text-slate-900">
            {order.orderNumber}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total
            </label>
            <div className="text-3xl font-bold text-emerald-600">
              Rp {numericTotal.toLocaleString('id-ID')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Metode Pembayaran
            </label>
            <select
              value={selectedPaymentMethod || ''}
              onChange={(e) => setSelectedPaymentMethod(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Pilih Metode</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jumlah Dibayar
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              min={numericTotal}
              step="1000"
              disabled={!isCash && selectedPaymentMethod !== null}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
              autoFocus
            />
            {!isCash && selectedPaymentMethod !== null && (
              <p className="mt-1 text-xs text-slate-500">
                Jumlah otomatis diset sesuai total untuk metode pembayaran non-tunai
              </p>
            )}
          </div>

          {change > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="text-sm text-emerald-700 font-medium">
                Kembalian
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                Rp {change.toLocaleString('id-ID')}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 text-slate-800 px-4 py-3 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                !selectedPaymentMethod || parseFloat(amountPaid) < numericTotal
              }
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold transition-colors shadow-md"
            >
              Proses Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

