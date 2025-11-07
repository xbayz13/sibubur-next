'use client';

import { useState } from 'react';
import { Product, Store, CreateOrderDto } from '@/types';

interface OrderFormProps {
  products: Product[];
  stores: Store[];
  defaultStoreId?: number;
  onSubmit: (order: CreateOrderDto) => void;
  onCancel: () => void;
}

interface OrderItem {
  productId: number;
  quantity: number;
  addons: Array<{
    addonId: number;
    price: number;
    quantity: number;
  }>;
}

export default function OrderForm({
  products,
  stores,
  defaultStoreId,
  onSubmit,
  onCancel,
}: OrderFormProps) {
  const [storeId, setStoreId] = useState<number>(defaultStoreId || stores[0]?.id || 0);
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1, addons: [] }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<OrderItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const addAddon = (itemIndex: number, addon: NonNullable<Product['addons']>[0]) => {
    const newItems = [...items];
    const existingAddon = newItems[itemIndex].addons.find((a) => a.addonId === addon.id);
    
    if (existingAddon) {
      existingAddon.quantity += 1;
    } else {
      newItems[itemIndex].addons.push({
        addonId: addon.id,
        price: addon.price,
        quantity: 1,
      });
    }
    
    setItems(newItems);
  };

  const removeAddon = (itemIndex: number, addonId: number) => {
    const newItems = [...items];
    newItems[itemIndex].addons = newItems[itemIndex].addons.filter(
      (a) => a.addonId !== addonId
    );
    setItems(newItems);
  };

  const calculateTotal = () => {
    let total = 0;
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        total += product.price * item.quantity;
        item.addons.forEach((addon) => {
          total += addon.price * addon.quantity * item.quantity;
        });
      }
    });
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Tambahkan minimal satu item');
      return;
    }

    if (items.some((item) => item.productId === 0)) {
      alert('Pilih produk untuk semua item');
      return;
    }

    onSubmit({
      storeId,
      customerName: customerName.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        addons: item.addons.length > 0 ? item.addons : undefined,
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Buat Pesanan Baru</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Toko *
              </label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(Number(e.target.value))}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
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
                Nama Pelanggan (Opsional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Masukkan nama pelanggan"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Item Pesanan *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Tambah Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <select
                            value={item.productId}
                            onChange={(e) =>
                              updateItem(index, { productId: Number(e.target.value) })
                            }
                            required
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-2"
                          >
                            <option value={0}>Pilih Produk</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} - Rp {p.price.toLocaleString('id-ID')}
                              </option>
                            ))}
                          </select>

                          {product && (
                            <div className="mt-2">
                              <label className="block text-xs text-slate-600 mb-1">
                                Jumlah
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(index, {
                                      quantity: Math.max(1, item.quantity - 1),
                                    })
                                  }
                                  className="w-8 h-8 border border-slate-300 rounded flex items-center justify-center"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(index, {
                                      quantity: Number(e.target.value),
                                    })
                                  }
                                  className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(index, { quantity: item.quantity + 1 })
                                  }
                                  className="w-8 h-8 border border-slate-300 rounded flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>

                              {product.addons && product.addons.length > 0 && (
                                <div className="mt-3">
                                  <label className="block text-xs text-slate-600 mb-1">
                                    Addon
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {product.addons.map((addon) => {
                                      const addonInItem = item.addons.find(
                                        (a) => a.addonId === addon.id
                                      );
                                      return (
                                        <button
                                          key={addon.id}
                                          type="button"
                                          onClick={() => addAddon(index, addon)}
                                          className={`text-xs px-3 py-1 rounded ${
                                            addonInItem
                                              ? 'bg-indigo-600 text-white'
                                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                          }`}
                                        >
                                          {addon.name} (+Rp {addon.price.toLocaleString('id-ID')})
                                          {addonInItem && ` x${addonInItem.quantity}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {item.addons.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {item.addons.map((addon) => {
                                        const addonProduct = product.addons?.find(
                                          (a) => a.id === addon.addonId
                                        );
                                        return (
                                          <div
                                            key={addon.addonId}
                                            className="flex items-center justify-between text-xs bg-slate-50 px-2 py-1 rounded"
                                          >
                                            <span>
                                              {addonProduct?.name} x{addon.quantity}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <span>
                                                Rp{' '}
                                                {(addon.price * addon.quantity).toLocaleString(
                                                  'id-ID'
                                                )}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => removeAddon(index, addon.addonId)}
                                                className="text-rose-600 hover:text-rose-700"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-rose-600 hover:text-rose-700 self-start"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {items.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Buat Pesanan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

