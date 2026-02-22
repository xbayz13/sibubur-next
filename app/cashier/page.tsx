'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { Product, Store, PaymentMethod, CreateOrderDto } from '@/types';
import ReceiptPrint from '@/components/Orders/ReceiptPrint';
import Link from 'next/link';
import { isAutoPrintKitchenEnabled, isAutoPrintCustomerEnabled, shouldShowKitchenPrintButton, shouldShowCustomerPrintButton } from '@/lib/print-settings';
import { isInstantPaymentEnabled } from '@/lib/instant-payment-settings';

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
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [receiptType, setReceiptType] = useState<'kitchen' | 'customer'>('kitchen');
  const [receiptTransaction, setReceiptTransaction] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentOrder, setCurrentOrder] = useState<any>(null); // Store the created order
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false); // Mobile cart visibility
  const storeSetRef = useRef(false); // Track if store has been set

  // Load products, stores, and payment methods on mount (these don't depend on selectedStoreId)
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
      } catch (error: any) {
        console.error('Error loading static data:', error);
        showToast(error.response?.data?.message || 'Gagal memuat data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadStaticData();
  }, []); // Run only once on mount

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

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

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
  const { subtotal, total } = useMemo(() => {
    let sub = 0;
    cart.forEach((item) => {
      sub += item.product.price * item.quantity;
      item.addons.forEach((addon) => {
        sub += addon.price * addon.quantity * item.quantity;
      });
    });
    return {
      subtotal: sub,
      total: sub,
    };
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
      setCurrentOrder(newOrder);
      
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal membuat pesanan';
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
      const transactionWithChange = {
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
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memproses pembayaran', 'error');
      console.error('Error processing payment:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen xl:flex bg-slate-50">
        <div>
          <Sidebar />
        </div>
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
          } ${isMobileOpen ? 'ml-0' : ''}`}
        >
          <Header />
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="mb-2">
                <BackButton href="/" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Kasir</h1>
                  <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Sistem Point of Sale</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  {stores.length > 0 && !user?.storeId && (
                    <select
                      value={selectedStoreId || ''}
                      onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {user?.storeId && (
                    <div className="px-3 sm:px-4 py-2 bg-slate-100 rounded-lg text-slate-700 font-medium text-sm sm:text-base">
                      <span className="hidden sm:inline">
                        {stores.find((s) => s.id === user.storeId)?.name || 'Toko Anda'}
                      </span>
                      <span className="sm:hidden">Toko</span>
                    </div>
                  )}
                  <Link
                    href="/open-orders"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-xl font-medium text-sm sm:text-base group"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Pesanan Terbuka</span>
                    <span className="sm:hidden">Pesanan</span>
                  </Link>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-xl font-bold text-emerald-600">
                      Rp {total.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <div className="flex-1 flex overflow-hidden relative">
            {/* Products Section */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Search and Category Filter */}
              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-lg"
                  />
                  {/* Mobile Cart Toggle Button */}
                  <button
                    onClick={() => setShowCart(!showCart)}
                    className="lg:hidden px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 relative"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {cart.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cart.length}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Semua
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(String(category.id))}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === String(category.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">Memuat produk...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                      >
                        {product.imageUrl && (
                          <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-slate-100">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="font-semibold text-slate-900 mb-1 line-clamp-2">
                          {product.name}
                        </div>
                        <div className="text-lg font-bold text-emerald-600">
                          Rp {Number(product.price).toLocaleString('id-ID')}
                        </div>
                        {product.addons && product.addons.length > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            +{product.addons.length} addon
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {filteredProducts.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <p className="text-slate-500">
                        {products.length === 0
                          ? 'Tidak ada produk tersedia. Silakan tambahkan produk terlebih dahulu.'
                          : 'Tidak ada produk ditemukan dengan filter yang dipilih.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cart Sidebar */}
            <div
              className={`fixed lg:static inset-y-0 right-0 w-full sm:w-96 bg-white flex flex-col z-40 transform transition-transform duration-300 ${
                showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
              }`}
            >
              {/* Mobile Cart Header */}
              <div className="lg:hidden p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Keranjang</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <svg
                    className="w-6 h-6 text-slate-600"
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
                </button>
              </div>

              {/* Cart Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Keranjang</h2>
                <input
                  type="text"
                  placeholder="Nama Pelanggan (opsional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{item.product.name}</div>
                          <div className="text-sm text-slate-600">
                            Rp {Number(item.product.price).toLocaleString('id-ID')} × {item.quantity}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-rose-600 hover:text-rose-800 text-lg font-bold"
                        >
                          ×
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="w-8 h-8 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="w-8 h-8 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Addons */}
                      {item.product.addons && item.product.addons.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-slate-600 mb-1">Addon:</div>
                          {item.product.addons.map((addon) => {
                            const cartAddon = item.addons.find((a) => a.addonId === addon.id);
                            const addonQuantity = cartAddon?.quantity || 0;
                            return (
                              <div
                                key={addon.id}
                                className="flex items-center justify-between text-xs bg-white rounded p-2"
                              >
                                <span className="text-slate-700">{addon.name}</span>
                                <div className="flex items-center gap-2">
                                  {addonQuantity > 0 && (
                                    <button
                                      onClick={() => removeAddon(item.productId, addon.id)}
                                      className="w-6 h-6 rounded bg-rose-100 text-rose-600 hover:bg-rose-200 font-bold"
                                    >
                                      −
                                    </button>
                                  )}
                                  <span className="w-6 text-center font-semibold text-slate-900">
                                    {addonQuantity}
                                  </span>
                                  <button
                                    onClick={() => addAddon(item.productId, addon)}
                                    className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Item Total */}
                      <div className="mt-2 pt-2 border-t border-slate-200 text-sm font-semibold text-slate-900">
                        Subtotal: Rp{' '}
                        {(
                          item.product.price * item.quantity +
                          item.addons.reduce(
                            (sum, a) => sum + a.price * a.quantity * item.quantity,
                            0
                          )
                        ).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))
                )}
              </div>

                {/* Cart Summary */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-slate-800">Total:</span>
                  <span className="text-emerald-600">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={cart.length === 0}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                >
                  Buat Pesanan
                </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Cart Overlay */}
          {showCart && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setShowCart(false)}
            />
          )}

          {/* Payment Modal */}
          {showPayment && currentOrder && (
            <PaymentModal
              total={Number(currentOrder.totalAmount || 0)}
              paymentMethods={paymentMethods}
              onProcess={handleProcessPayment}
              onClose={() => {
                setShowPayment(false);
                setCurrentOrder(null);
              }}
            />
          )}

            {/* Receipt */}
            {showReceipt && receiptOrder && (
              ((receiptType === 'kitchen' && shouldShowKitchenPrintButton()) ||
               (receiptType === 'customer' && shouldShowCustomerPrintButton())) && (
                <ReceiptPrint
                  order={receiptOrder}
                  type={receiptType}
                  onClose={handleReceiptClosed}
                  transaction={receiptTransaction}
                  autoPrint={receiptType === 'kitchen'}
                />
              )
            )}
          </div>
        </div>
      </div>
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
  const [change, setChange] = useState<number>(0);

  // Ensure total is a number (PostgreSQL returns decimals as strings sometimes)
  const numericTotal = typeof total === 'string' ? parseFloat(total) : Number(total);

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
    onProcess(selectedPaymentMethod, paid, change);
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

