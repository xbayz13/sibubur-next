'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import BackButton from '@/components/Layout/BackButton';
import { useSidebar } from '@/contexts/SidebarContext';
import { useToast } from '@/components/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';
import { productsService } from '@/lib/services/products';
import { storesService } from '@/lib/services/stores';
import { paymentMethodsService } from '@/lib/services/payment-methods';
import { ordersService } from '@/lib/services/orders';
import { transactionsService, CreateTransactionDto } from '@/lib/services/transactions';
import { Product, Store, PaymentMethod, CreateOrderDto, Order, Transaction } from '@/types';
import ReceiptPrint from '@/components/Orders/ReceiptPrint';
import Link from 'next/link';
import { isAutoPrintKitchenEnabled, isAutoPrintCustomerEnabled, shouldShowKitchenPrintButton, shouldShowCustomerPrintButton } from '@/lib/print-settings';
import { isInstantPaymentEnabled } from '@/lib/instant-payment-settings';
import SearchAutocomplete from '@/components/ui/SearchAutocomplete';
import { useCartPersistence } from '@/hooks/useCartPersistence';
import CartFloatingButton from '@/components/Cashier/CartFloatingButton';
import PaymentModalComponent from '@/components/Orders/PaymentModal';

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
  addons: Array<{
    addonId: number;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export default function CashierPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(
    user?.storeId || undefined
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptType, setReceiptType] = useState<'kitchen' | 'customer'>('kitchen');
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | undefined>(
    undefined
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null); // Store the created order
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false); // Mobile cart visibility
  const storeSetRef = useRef(false); // Track if store has been set

  // Persist cart to localStorage automatically
  useCartPersistence(cart, setCart, customerName, setCustomerName);

  // Load products, stores, and payment methods on mount (these don't depend on selectedStoreId)
  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) return response.data.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        setLoading(true);
        console.log('Loading products, stores, and payment methods...');
        const [productsRes, storesRes, paymentMethodsRes] = await Promise.all([
          productsService.getAll({ limit: 100 }),
          storesService.getAll({ limit: 100 }),
          paymentMethodsService.getAll({ limit: 100 }),
        ]);

        console.log('Products loaded:', productsRes.data.length, productsRes.data);
        console.log('Stores loaded:', storesRes.data.length, storesRes.data);
        console.log('Payment methods loaded:', paymentMethodsRes.data.length, paymentMethodsRes.data);

        setProducts(productsRes.data);
        setStores(storesRes.data);
        setPaymentMethods(paymentMethodsRes.data);

        // Load cart from localStorage (for cancel and create new flow)
        const savedCart = localStorage.getItem('cashier_cart');
        const savedCustomerName = localStorage.getItem('cashier_customerName');
        
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart);
            // Validate cart data with loaded products
            if (Array.isArray(cartData) && cartData.length > 0) {
              const validCart = cartData.filter((item: CartItem) =>
                productsRes.data.some((p) => p.id === item.productId)
              );
              if (validCart.length > 0) {
                setCart(validCart);
                showToast('Item dari pesanan yang dibatalkan telah ditambahkan ke keranjang', 'success');
              }
              // Clear localStorage after loading
              localStorage.removeItem('cashier_cart');
            }
          } catch (error) {
            console.error('Failed to load cart from localStorage:', error);
            localStorage.removeItem('cashier_cart');
          }
        }
        
        if (savedCustomerName) {
          setCustomerName(savedCustomerName);
          localStorage.removeItem('cashier_customerName');
        }

        // Clear cart if it contains invalid product IDs (only if not loading from localStorage)
        if (!savedCart) {
          const productsData = productsRes.data;
          setCart((currentCart) => {
            const validCart = currentCart.filter((item) =>
              productsData.some((p) => p.id === item.productId)
            );
            if (validCart.length !== currentCart.length) {
              console.warn('Removed invalid products from cart');
              showToast('Keranjang telah dibersihkan karena ada produk yang tidak valid', 'info');
            }
            return validCart;
          });
        }

        // Auto-set store: prioritize user.storeId, then first store
        if (!storeSetRef.current && storesRes.data.length > 0) {
          const storeToSet = user?.storeId || storesRes.data[0].id;
          console.log('Setting initial store:', storeToSet);
          setSelectedStoreId(storeToSet);
          storeSetRef.current = true;
        }
      } catch (error: unknown) {
        console.error('Error loading static data:', error);
        showToast(getErrorMessage(error, 'Gagal memuat data'), 'error');
      } finally {
        setLoading(false);
      }
    };

    loadStaticData();
  }, [showToast, user?.storeId]); // Run only once on mount

  // Auto-set store from user when user data is loaded (if stores are already loaded)
  useEffect(() => {
    if (user?.storeId && stores.length > 0 && !storeSetRef.current) {
      console.log('Setting store from user:', user.storeId);
      setSelectedStoreId(user.storeId);
      storeSetRef.current = true;
    }
  }, [user?.storeId, stores.length]);


  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category?.id === Number(selectedCategory));
    }

    return filtered;
  }, [products, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = products
      .map((p) => p.category)
      .filter((c) => c !== null && c !== undefined);
    const unique = Array.from(new Map(cats.map((c) => [c!.id, c])).values());
    return unique;
  }, [products]);

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity: 1,
          addons: [],
        },
      ]);
    }
    showToast(`${product.name} ditambahkan ke keranjang`, 'success');
  };

  // Update cart item quantity
  const updateQuantity = (productId: number, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + delta;
            return { ...item, quantity: Math.max(1, newQuantity) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Add addon to cart item
  const addAddon = (productId: number, addon: NonNullable<Product['addons']>[0]) => {
    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const existingAddon = item.addons.find((a) => a.addonId === addon.id);
          if (existingAddon) {
            return {
              ...item,
              addons: item.addons.map((a) =>
                a.addonId === addon.id ? { ...a, quantity: a.quantity + 1 } : a
              ),
            };
          } else {
            return {
              ...item,
              addons: [
                ...item.addons,
                {
                  addonId: addon.id,
                  name: addon.name,
                  price: addon.price,
                  quantity: 1,
                },
              ],
            };
          }
        }
        return item;
      })
    );
  };

  // Remove addon from cart item
  const removeAddon = (productId: number, addonId: number) => {
    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            addons: item.addons
              .map((a) => (a.addonId === addonId ? { ...a, quantity: a.quantity - 1 } : a))
              .filter((a) => a.quantity > 0),
          };
        }
        return item;
      })
    );
  };

  // Calculate totals
  const total = useMemo(() => {
    let sub = 0;
    cart.forEach((item) => {
      sub += item.product.price * item.quantity;
      item.addons.forEach((addon) => {
        sub += addon.price * addon.quantity * item.quantity;
      });
    });
    return sub;
  }, [cart]);

  // Create order (without payment)
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      showToast('Keranjang kosong', 'error');
      return;
    }

    if (!selectedStoreId) {
      showToast('Pilih toko terlebih dahulu', 'error');
      return;
    }

    // Validate that all products in cart still exist
    const invalidItems = cart.filter((item) => {
      const productExists = products.some((p) => p.id === item.productId);
      return !productExists;
    });

    if (invalidItems.length > 0) {
      showToast(
        `Produk tidak valid ditemukan di keranjang. Silakan refresh halaman dan tambahkan produk kembali.`,
        'error'
      );
      // Remove invalid items from cart
      setCart(cart.filter((item) => products.some((p) => p.id === item.productId)));
      return;
    }

    try {
      const orderData: CreateOrderDto = {
        storeId: selectedStoreId,
        customerName: customerName.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          addons:
            item.addons.length > 0
              ? item.addons.map((a) => ({
                  addonId: a.addonId,
                  price: a.price,
                  quantity: a.quantity,
                }))
              : undefined,
        })),
      };

      console.log('Creating order with data:', orderData);
      const newOrder = await ordersService.create(orderData);
      console.log('Order created:', newOrder);
      setCurrentOrder(newOrder);
      setShowPayment(true);
      console.log('Payment modal should show now');
      
      showToast('Pesanan berhasil dibuat', 'success');

      // Auto-print kitchen receipt after order creation (if enabled)
      if (isAutoPrintKitchenEnabled()) {
        setReceiptOrder(newOrder);
        setReceiptType('kitchen');
        setShowReceipt(true);
      }

      // Show payment form immediately if instant payment is enabled
      if (isInstantPaymentEnabled()) {
        setShowPayment(true);
      }

      // Clear cart but keep customer name for next order
      setCart([]);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Gagal membuat pesanan');
      showToast(errorMessage, 'error');
      console.error('Error creating order:', error);
      console.error('Order data that failed:', {
        storeId: selectedStoreId,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
        })),
      });
    }
  };

  // Handle receipt closed
  const handleReceiptClosed = () => {
    setShowReceipt(false);
    setReceiptOrder(null);
    // Don't reset currentOrder here, keep it for payment
  };

  const handleProcessPayment = async (
    paymentMethodId: number,
    amount: number,
    change: number
  ) => {
    if (!currentOrder || !selectedStoreId) return;

    try {
      // Create transaction
      const transactionData: CreateTransactionDto = {
        orderId: currentOrder.id,
        paymentMethodId,
        amount,
        storeId: selectedStoreId,
      };

      const transaction = await transactionsService.create(transactionData);
      
      // Reload order to get updated status
      const updatedOrder = await ordersService.getById(currentOrder.id);
      
      // Add change to transaction data
      const transactionWithChange: Transaction = {
        ...transaction,
        change: Math.max(0, change),
      };
      
      showToast('Pembayaran berhasil diproses', 'success');
      setShowPayment(false);
      
      // Auto-print customer receipt after payment (if enabled)
      if (isAutoPrintCustomerEnabled()) {
        setReceiptOrder(updatedOrder);
        setReceiptTransaction(transactionWithChange);
        setReceiptType('customer');
        setShowReceipt(true);
      }
      
      setCurrentOrder(null);
    } catch (error: unknown) {
      showToast(getErrorMessage(error, 'Gagal memproses pembayaran'), 'error');
      console.error('Error processing payment:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen xl:flex bg-[#090d16] text-white">
        <div>
          <Sidebar />
        </div>
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
          } ${isMobileOpen ? 'ml-0' : ''}`}
        >
          <Header />
          <div className="flex-1 flex flex-col overflow-hidden bg-[#090d16]">
            {/* Page Header */}
            <div className="bg-[#090d16] border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4">
              <div className="mb-2">
                <BackButton href="/" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Kasir</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  {stores.length > 0 && !user?.storeId && (
                    <select
                      value={selectedStoreId || ''}
                      onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                      className="px-4 py-2 border border-white/10 rounded-lg bg-[#090d16] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {user?.storeId && (
                    <div className="px-3 sm:px-4 py-2 bg-white/5 rounded-lg font-medium text-sm sm:text-base">
                      {stores.find((s) => s.id === user.storeId)?.name || 'Toko'}
                    </div>
                  )}
                  <Link
                    href="/open-orders"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all font-medium text-sm sm:text-base"
                  >
                    <span>Pesanan Terbuka</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              {/* Products Section */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                  <div className="flex gap-2">
                    <SearchAutocomplete
                      items={products}
                      searchKeys={['name', 'category.name']}
                      onSelect={(product) => addToCart(product)}
                      placeholder="Cari produk..."
                      recentItemsKey="cashier_recent_products"
                      maxRecentItems={8}
                    />
                  </div>
                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-lg border border-white/10 ${
                        selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'hover:bg-white/5'
                      }`}
                    >
                      Semua
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(String(c.id))}
                        className={`px-4 py-2 rounded-lg border border-white/10 ${
                          selectedCategory === String(c.id) ? 'bg-orange-500 text-white' : 'hover:bg-white/5'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 sm:gap-4">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-orange-500/50 transition-all group"
                    >
                      {p.imageUrl && (
                        <div className="relative w-full aspect-square mb-2 rounded-md overflow-hidden">
                          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="font-semibold text-sm line-clamp-2">{p.name}</div>
                      <div className="text-orange-500 font-bold">Rp {Number(p.price).toLocaleString('id-ID')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Panel */}
              <div className="w-96 bg-gray-900/40 backdrop-blur-md border-l border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                  <h2 className="text-lg font-semibold mb-3">Keranjang</h2>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Pelanggan"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="bg-white/5 rounded-lg p-3 border border-white/5">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">{item.product.name}</div>
                        <button onClick={() => removeFromCart(item.productId)} className="text-rose-500">×</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="min-h-[44px] w-10 flex items-center justify-center bg-gray-800 border border-white/10 hover:bg-orange-500/10 hover:text-orange-500">-</button>
                        <span className="flex-1 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="min-h-[44px] w-10 flex items-center justify-center bg-gray-800 border border-white/10 hover:bg-orange-500/10 hover:text-orange-500">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-white/5 bg-[#090d16]">
                  <div className="flex justify-between text-xl font-bold mb-4">
                    <span>Total</span>
                    <span className="text-orange-500">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCreateOrder}
                      className="w-full h-12 bg-[#f97316] text-white rounded-lg font-bold hover:bg-[#ea580c] transition-all"
                    >
                      Bayar Sekarang
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      className="w-full bg-white/10 py-3 rounded-lg font-bold hover:bg-white/20 transition-all"
                    >
                      Buat Pesanan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && currentOrder && (
        <PaymentModalComponent
          isOpen={true}
          total={Number(currentOrder.totalAmount || 0)}
          paymentMethods={paymentMethods}
          onComplete={(payment) => handleProcessPayment(payment.methodId, payment.amount, payment.change)}
          onClose={() => {
            setShowPayment(false);
            setCurrentOrder(null);
          }}
        />
      )}
    </ProtectedRoute>
  );
}

// Payment Modal Component
interface PaymentModalProps {
  total: number;
  paymentMethods: PaymentMethod[];
  onProcess: (paymentMethodId: number, amount: number, change: number) => void;
  onClose: () => void;
}

function PaymentModal({ total, paymentMethods, onProcess, onClose }: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');

  // Ensure total is a number (PostgreSQL returns decimals as strings sometimes)
  const numericTotal = typeof total === 'string' ? parseFloat(total) : Number(total);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
  const isCash = selectedMethod?.name?.toLowerCase().includes('cash') || false;

  const handlePaymentMethodChange = (value: string) => {
    const id = value ? Number(value) : null;
    setSelectedPaymentMethod(id);
    if (!id) {
      setAmountPaid('');
      return;
    }

    const method = paymentMethods.find((m) => m.id === id);
    const methodIsCash = method?.name?.toLowerCase().includes('cash') || false;
    setAmountPaid(methodIsCash ? '' : numericTotal.toString());
  };

  const paidAmount = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paidAmount - numericTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentMethod) {
      alert('Pilih metode pembayaran');
      return;
    }
    if (paidAmount < numericTotal) {
      alert('Jumlah pembayaran kurang');
      return;
    }
    onProcess(selectedPaymentMethod, paidAmount, change);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Pembayaran</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Total</label>
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
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
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
              <div className="text-sm text-emerald-700 font-medium">Kembalian</div>
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
              disabled={!selectedPaymentMethod || parseFloat(amountPaid) < numericTotal}
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
