'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import BackButton from '@/components/Layout/BackButton';
import { useToast } from '@/components/ToastContainer';
import { ordersService } from '@/lib/services/orders';
import { productsService } from '@/lib/services/products';
import { storesService } from '@/lib/services/stores';
import { paymentMethodsService } from '@/lib/services/payment-methods';
import { transactionsService } from '@/lib/services/transactions';
import { Order, Product, Store, PaymentMethod, CreateOrderDto } from '@/types';
import OrderForm from '@/components/Orders/OrderForm';
import OrderList from '@/components/Orders/OrderList';
import PaymentModal from '@/components/Orders/PaymentModal';
import ReceiptPrint from '@/components/Orders/ReceiptPrint';
import Pagination from '@/components/ui/Pagination';
import { isAutoPrintKitchenEnabled, isAutoPrintCustomerEnabled, shouldShowKitchenPrintButton, shouldShowCustomerPrintButton } from '@/lib/print-settings';

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptType, setReceiptType] = useState<'kitchen' | 'customer'>('customer');
  const [receiptTransaction, setReceiptTransaction] = useState<any>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Load static data (products, stores, paymentMethods) only once
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [productsRes, storesRes, paymentMethodsRes] = await Promise.all([
          productsService.getAll({ limit: 100 }),
          storesService.getAll({ limit: 100 }),
          paymentMethodsService.getAll({ limit: 100 }),
        ]);

        setProducts(productsRes.data);
        setStores(storesRes.data);
        setPaymentMethods(paymentMethodsRes.data);
        setLoading(false);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data', 'error');
        setLoading(false);
      }
    };
    loadStaticData();
  }, [showToast]);

  // Reset page when store filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedStoreId]);

  // Load orders when store filter or page changes (skip until store is selected)
  useEffect(() => {
    if (!selectedStoreId) return;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrders([]);
        const res = await ordersService.getAll({
          storeId: selectedStoreId,
          page,
          limit,
        });
        setOrders(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Gagal memuat data pesanan', 'error');
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [selectedStoreId, page, showToast]);

  const reloadOrders = useCallback(async (resetToPage1 = false) => {
    try {
      setOrdersLoading(true);
      const pageToLoad = resetToPage1 ? 1 : page;
      const res = await ordersService.getAll({
        storeId: selectedStoreId,
        page: pageToLoad,
        limit,
      });
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (resetToPage1) setPage(1);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data pesanan', 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [selectedStoreId, page, limit, showToast]);

  const handleCreateOrder = async (orderData: CreateOrderDto) => {
    try {
      const newOrder = await ordersService.create(orderData);
      showToast('Pesanan berhasil dibuat', 'success');
      setShowOrderForm(false);
      await reloadOrders(true); // Reload orders after creating (reset to page 1)
      
      // Auto-print kitchen receipt after order creation (if enabled)
      if (isAutoPrintKitchenEnabled()) {
        setReceiptOrder(newOrder);
        setReceiptType('kitchen');
        setShowReceipt(true);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal membuat pesanan', 'error');
    }
  };

  const handlePayment = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (paymentMethodId: number, amount: number, change: number) => {
    if (!selectedOrder) return;

    try {
      const transaction = await transactionsService.create({
        orderId: selectedOrder.id,
        paymentMethodId,
        amount,
        storeId: selectedOrder.store.id,
      });

      // Reload order to get updated status
      const updatedOrder = await ordersService.getById(selectedOrder.id);

      // Add change to transaction data
      const transactionWithChange = {
        ...transaction,
        change: Math.max(0, change),
      };

      showToast('Pembayaran berhasil diproses', 'success');
      setShowPaymentModal(false);
      
      // Auto-print customer receipt after payment (if enabled)
      if (isAutoPrintCustomerEnabled()) {
        setReceiptOrder(updatedOrder);
        setReceiptTransaction(transactionWithChange);
        setReceiptType('customer');
        setShowReceipt(true);
      }
      
      setSelectedOrder(null);
      await reloadOrders(); // Reload orders after payment (order stays on current page)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memproses pembayaran', 'error');
    }
  };

  const handlePrintReceipt = (order: Order, type: 'kitchen' | 'customer') => {
    setReceiptOrder(order);
    setReceiptType(type);
    setShowReceipt(true);
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;

    try {
      await ordersService.cancel(orderId);
      showToast('Pesanan berhasil dibatalkan', 'success');
      await reloadOrders(); // Reload orders after cancel
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal membatalkan pesanan', 'error');
    }
  };

  if (loading && orders.length === 0 && products.length === 0) {
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
        <div className="space-y-4 sm:space-y-6">
          <BackButton href="/" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Pesanan</h1>
              <p className="text-sm sm:text-base text-slate-600">Sistem pencatatan pesanan dengan nomor order yang dapat dicetak</p>
            </div>
            <button
              onClick={() => setShowOrderForm(true)}
              className="w-full sm:w-auto bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              + Buat Pesanan Baru
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stores.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter Toko
                </label>
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 bg-white"
                >
                  <option value="">Semua Toko</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>

          {ordersLoading && orders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
              <div className="text-slate-500">Memuat pesanan...</div>
            </div>
          ) : (
            <>
              <OrderList
                orders={orders}
                onPayment={handlePayment}
                onPrintReceipt={handlePrintReceipt}
                onCancel={handleCancelOrder}
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

          {showOrderForm && (
            <OrderForm
              products={products}
              stores={stores}
              defaultStoreId={selectedStoreId}
              onSubmit={handleCreateOrder}
              onCancel={() => setShowOrderForm(false)}
            />
          )}

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

          {showReceipt && receiptOrder && (
            ((receiptType === 'kitchen' && shouldShowKitchenPrintButton()) ||
             (receiptType === 'customer' && shouldShowCustomerPrintButton())) && (
              <ReceiptPrint
                order={receiptOrder}
                type={receiptType}
                onClose={() => {
                  setShowReceipt(false);
                  setReceiptOrder(null);
                  setReceiptTransaction(null);
                }}
                transaction={receiptTransaction}
                autoPrint={receiptType === 'kitchen'}
              />
            )
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
