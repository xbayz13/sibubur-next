'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';
import { ordersService } from '@/lib/services/orders';
import { storesService } from '@/lib/services/stores';
import { transactionsService, CreateTransactionDto } from '@/lib/services/transactions';
import { paymentMethodsService } from '@/lib/services/payment-methods';
import { Order, Store, PaymentMethod, Product } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReceiptPrint from '@/components/Orders/ReceiptPrint';
import { productsService } from '@/lib/services/products';
import { shouldShowKitchenPrintButton, shouldShowCustomerPrintButton, isAutoPrintCustomerEnabled } from '@/lib/print-settings';
import Pagination from '@/components/ui/Pagination';

export default function OpenOrdersPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(
    user?.storeId || undefined
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptType, setReceiptType] = useState<'kitchen' | 'customer'>('kitchen');
  const [receiptTransaction, setReceiptTransaction] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadStores();
    loadPaymentMethods();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productsService.getAll({ limit: 100 });
      setProducts(res.data);
    } catch (error: any) {
      console.error('Failed to load products:', error);
    }
  };

  useEffect(() => {
    // Auto-set store for cashier users, otherwise use first store
    if (user?.storeId) {
      setSelectedStoreId(user.storeId);
    } else if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, user?.storeId]);

  const prevSelectedStoreIdRef = useRef<number | undefined>(undefined);
  const skipNextPageLoadRef = useRef(false);

  const loadStores = async () => {
    try {
      const res = await storesService.getAll({ limit: 100 });
      setStores(res.data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data toko', 'error');
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await paymentMethodsService.getAll({ limit: 100 });
      setPaymentMethods(res.data);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const loadOrders = useCallback(async (pageOverride?: number) => {
    if (!selectedStoreId) return;
    setLoading(true);
    const pageToLoad = pageOverride ?? page;
    try {
      const res = await ordersService.getAll({
        storeId: selectedStoreId,
        status: 'open',
        page: pageToLoad,
        limit,
      });
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (pageOverride !== undefined) setPage(pageOverride);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat pesanan', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, page, limit, showToast]);

  useEffect(() => {
    if (!selectedStoreId) return;
    const storeJustChanged = prevSelectedStoreIdRef.current !== selectedStoreId;
    prevSelectedStoreIdRef.current = selectedStoreId;

    if (storeJustChanged) {
      loadOrders(1); // loadOrders(1) sets page internally; skip next run when page updates
      skipNextPageLoadRef.current = true;
      return;
    }
    if (skipNextPageLoadRef.current) {
      skipNextPageLoadRef.current = false;
      return;
    }
    loadOrders(page);
  }, [selectedStoreId, page, loadOrders]);

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

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handlePrintReceipt = (order: Order, type: 'kitchen' | 'customer') => {
    setSelectedOrder(order);
    setReceiptType(type);
    setShowReceipt(true);
  };

  const handleUpdateOrder = async (orderId: number, updateData: { customerName?: string }) => {
    try {
      await ordersService.update(orderId, updateData);
      showToast('Pesanan berhasil diperbarui', 'success');
      setShowEditModal(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memperbarui pesanan', 'error');
    }
  };

  const handleCancelClick = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleCancelOrder = async (createNew: boolean = false) => {
    if (!selectedOrder) return;

    try {
      await ordersService.cancel(selectedOrder.id);
      showToast('Pesanan berhasil dibatalkan', 'success');
      setShowCancelModal(false);

      if (createNew) {
        // Prepare cart data from order
        const cartData = selectedOrder.orderItems.map((item) => {
          // Use item.product directly since OrderItem has product, not productId
          const product = item.product;
          if (!product) return null;

          const addons = item.orderItemAddons?.map((addon) => ({
            addonId: addon.addonId,
            name: addon.addon.name,
            price: addon.addonPrice,
            quantity: addon.quantity,
          })) || [];

          return {
            productId: product.id,
            product: product,
            quantity: item.quantity,
            addons: addons,
          };
        }).filter(Boolean);

        // Store cart data in localStorage
        localStorage.setItem('cashier_cart', JSON.stringify(cartData));
        localStorage.setItem('cashier_customerName', selectedOrder.customerName || '');

        // Redirect to cashier
        router.push('/cashier');
      } else {
        setSelectedOrder(null);
        await loadOrders();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal membatalkan pesanan', 'error');
    }
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

      const transaction = await transactionsService.create(transactionData);
      
      // Reload order to get updated status
      const updatedOrder = await ordersService.getById(selectedOrder.id);
      
      // Calculate change
      const totalAmount = Number(updatedOrder.totalAmount);
      const change = Math.max(0, amount - totalAmount);
      
      // Add change to transaction data
      const transactionWithChange = {
        ...transaction,
        change: change,
      };

      showToast('Pembayaran berhasil diproses', 'success');
      setShowPaymentModal(false);
      
      // Auto-print customer receipt after payment (if enabled)
      if (isAutoPrintCustomerEnabled()) {
        setSelectedOrder(updatedOrder);
        setReceiptTransaction(transactionWithChange);
        setReceiptType('customer');
        setShowReceipt(true);
      }
      
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
          <BackButton href="/" />
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
              {!user?.storeId && (
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
              )}
              {user?.storeId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Toko
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-medium">
                    {stores.find((s) => s.id === user.storeId)?.name || 'Toko Anda'}
                  </div>
                </div>
              )}

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
                            Rp 0
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
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewDetail(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all font-medium text-xs sm:text-sm shadow-sm hover:shadow"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Detail
                            </button>
                            {shouldShowKitchenPrintButton() && (
                              <button
                                onClick={() => handlePrintReceipt(order, 'kitchen')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all font-medium text-xs sm:text-sm shadow-sm hover:shadow"
                                title="Cetak Struk Dapur"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span className="hidden sm:inline">Dapur</span>
                              </button>
                            )}
                            {shouldShowCustomerPrintButton() && (
                              <button
                                onClick={() => handlePrintReceipt(order, 'customer')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-all font-medium text-xs sm:text-sm shadow-sm hover:shadow"
                                title="Cetak Struk Pelanggan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span className="hidden sm:inline">Pelanggan</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelClick(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-all font-medium text-xs sm:text-sm shadow-sm hover:shadow"
                              title="Batalkan Pesanan"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className="hidden sm:inline">Batal</span>
                            </button>
                            <button
                              onClick={() => handlePayOrder(order)}
                              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
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
              <>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={limit}
                  onPageChange={setPage}
                />
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      {searchQuery.trim()
                        ? `Menampilkan ${filteredOrders.length} dari ${orders.length} pada halaman ini`
                        : `Menampilkan ${filteredOrders.length} dari ${total} pesanan terbuka`}
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
              </>
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

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <DetailModal
            order={selectedOrder}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedOrder(null);
            }}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedOrder && products.length > 0 && (
          <EditOrderModal
            order={selectedOrder}
            products={products}
            onUpdate={handleUpdateOrder}
            onClose={() => {
              setShowEditModal(false);
              setSelectedOrder(null);
            }}
          />
        )}

        {/* Receipt Print */}
        {showReceipt && selectedOrder && (
          ((receiptType === 'kitchen' && shouldShowKitchenPrintButton()) ||
           (receiptType === 'customer' && shouldShowCustomerPrintButton())) && (
            <ReceiptPrint
              order={selectedOrder}
              type={receiptType}
              onClose={() => {
                setShowReceipt(false);
                setSelectedOrder(null);
                setReceiptTransaction(null);
              }}
              transaction={receiptTransaction}
              autoPrint={receiptType === 'kitchen'}
            />
          )
        )}

        {/* Cancel Order Modal */}
        {showCancelModal && selectedOrder && (
          <CancelOrderModal
            order={selectedOrder}
            onCancel={() => handleCancelOrder(false)}
            onCancelAndCreateNew={() => handleCancelOrder(true)}
            onClose={() => {
              setShowCancelModal(false);
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

// Detail Modal Component
interface DetailModalProps {
  order: Order;
  onClose: () => void;
}

function DetailModal({ order, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Detail Pesanan</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nomor Pesanan</label>
                <div className="mt-1 text-sm text-slate-900 font-semibold">{order.orderNumber}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <div className="mt-1 text-sm text-slate-900">
                  {order.status === 'open' ? '⏳ Belum Bayar' : order.status === 'paid' ? '✅ Lunas' : '❌ Dibatalkan'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Pelanggan</label>
                <div className="mt-1 text-sm text-slate-900">{order.customerName || 'Tanpa Nama'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Toko</label>
                <div className="mt-1 text-sm text-slate-900">{order.store.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tanggal</label>
                <div className="mt-1 text-sm text-slate-900">
                  {new Date(order.createdAt).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Total</label>
                <div className="mt-1 text-lg font-bold text-emerald-600">
                  Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Item Pesanan</h3>
              <div className="space-y-3">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {item.quantity}x {item.product.name}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          @ Rp {Number(item.unitPrice).toLocaleString('id-ID')}
                        </div>
                        {item.orderItemAddons && item.orderItemAddons.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium text-slate-700">Addon:</div>
                            {item.orderItemAddons.map((addon, aidx) => (
                              <div key={aidx} className="text-xs text-slate-600 ml-4">
                                + {addon.quantity}x {addon.addon.name} @ Rp {Number(addon.addonPrice).toLocaleString('id-ID')}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-900">
                          Rp {Number(item.lineTotal).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Order Modal Component
interface EditOrderModalProps {
  order: Order;
  products: Product[];
  onUpdate: (orderId: number, updateData: { customerName?: string }) => Promise<void>;
  onClose: () => void;
}

function EditOrderModal({ order, products, onUpdate, onClose }: EditOrderModalProps) {
  const [customerName, setCustomerName] = useState(order.customerName || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(order.id, {
      customerName: customerName.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Edit Pesanan</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nomor Pesanan
              </label>
              <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-semibold">
                {order.orderNumber}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nama pelanggan (opsional)"
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm font-medium text-slate-700 mb-2">Item Pesanan:</div>
              <div className="space-y-2">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="text-sm text-slate-600">
                    {item.quantity}x {item.product.name}
                    {item.orderItemAddons && item.orderItemAddons.length > 0 && (
                      <div className="ml-4 text-xs text-slate-500">
                        {item.orderItemAddons.map((addon, aidx) => (
                          <div key={aidx}>
                            + {addon.quantity}x {addon.addon.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-sm font-semibold text-slate-900">
                  Total: Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <strong>Catatan:</strong> Saat ini hanya nama pelanggan yang dapat diubah. Untuk mengubah item pesanan, silakan batalkan pesanan dan buat pesanan baru.
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-200 text-slate-800 px-4 py-3 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Cancel Order Modal Component
interface CancelOrderModalProps {
  order: Order;
  onCancel: () => void;
  onCancelAndCreateNew: () => void;
  onClose: () => void;
}

function CancelOrderModal({
  order,
  onCancel,
  onCancelAndCreateNew,
  onClose,
}: CancelOrderModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-rose-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Batalkan Pesanan</h2>
              <p className="text-sm text-slate-600">Pilih aksi yang ingin dilakukan</p>
            </div>
          </div>

          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium text-slate-700 mb-1">Nomor Pesanan</div>
            <div className="text-lg font-semibold text-slate-900">{order.orderNumber}</div>
            <div className="text-sm text-slate-600 mt-1">
              Total: Rp {Number(order.totalAmount).toLocaleString('id-ID')}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={onCancel}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <svg
                    className="w-5 h-5 text-rose-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900">Batalkan Saja</div>
                  <div className="text-xs text-slate-600">Pesanan akan dibatalkan</div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button
              onClick={onCancelAndCreateNew}
              className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-300 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900">Batal dan Buat Baru</div>
                  <div className="text-xs text-slate-600">
                    Batal pesanan dan buat pesanan baru dengan item yang sama
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-200 text-slate-800 px-4 py-3 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

