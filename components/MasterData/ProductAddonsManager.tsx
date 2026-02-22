'use client';

import { useState, useEffect } from 'react';
import { Product, ProductAddon } from '@/types';
import { productsService } from '@/lib/services/products';
import { productAddonsService } from '@/lib/services/product-addons';
import { useToast } from '@/components/ToastContainer';

interface ProductAddonsManagerProps {
  product: Product;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProductAddonsManager({
  product,
  onClose,
  onUpdate,
}: ProductAddonsManagerProps) {
  const { showToast } = useToast();
  const [allAddons, setAllAddons] = useState<ProductAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>(
    product.addons?.map((a) => a.id) || []
  );
  const [priceOverrides, setPriceOverrides] = useState<Record<number, number>>({});

  useEffect(() => {
    loadAddons();
    // Initialize price overrides from existing product addons
    if (product.addons) {
      const overrides: Record<number, number> = {};
      product.addons.forEach((addon) => {
        overrides[addon.id] = addon.price;
      });
      setPriceOverrides(overrides);
    }
  }, [product]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const res = await productAddonsService.getAll({ limit: 100 });
      setAllAddons(res.data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal memuat data addon', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddon = (addonId: number) => {
    if (selectedAddonIds.includes(addonId)) {
      setSelectedAddonIds(selectedAddonIds.filter((id) => id !== addonId));
      const newOverrides = { ...priceOverrides };
      delete newOverrides[addonId];
      setPriceOverrides(newOverrides);
    } else {
      const addon = allAddons.find((a) => a.id === addonId);
      setSelectedAddonIds([...selectedAddonIds, addonId]);
      if (addon) {
        setPriceOverrides({
          ...priceOverrides,
          [addonId]: addon.price,
        });
      }
    }
  };

  const handlePriceOverrideChange = (addonId: number, price: string) => {
    const numPrice = parseFloat(price) || 0;
    setPriceOverrides({
      ...priceOverrides,
      [addonId]: numPrice,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get current addon IDs from product
      const currentAddonIds = product.addons?.map((a) => a.id) || [];
      
      // Find addons to add
      const addonsToAdd = selectedAddonIds.filter((id) => !currentAddonIds.includes(id));
      
      // Find addons to remove
      const addonsToRemove = currentAddonIds.filter((id) => !selectedAddonIds.includes(id));

      // Remove addons
      for (const addonId of addonsToRemove) {
        await productsService.removeAddon(product.id, addonId);
      }

      // Add new addons with price overrides
      for (const addonId of addonsToAdd) {
        const priceOverride = priceOverrides[addonId];
        const addon = allAddons.find((a) => a.id === addonId);
        // Only set override if it's different from default price
        const shouldOverride = addon && priceOverride !== addon.price;
        await productsService.addAddon(
          product.id,
          addonId,
          shouldOverride ? priceOverride : undefined
        );
      }

      // Update existing addons with new price overrides if changed
      const existingAddons = selectedAddonIds.filter((id) => currentAddonIds.includes(id));
      for (const addonId of existingAddons) {
        const addon = allAddons.find((a) => a.id === addonId);
        const currentProductAddon = product.addons?.find((a) => a.id === addonId);
        const newPrice = priceOverrides[addonId];
        
        if (addon && currentProductAddon) {
          // If price changed, we need to remove and re-add with new override
          if (newPrice !== currentProductAddon.price) {
            await productsService.removeAddon(product.id, addonId);
            const shouldOverride = newPrice !== addon.price;
            await productsService.addAddon(
              product.id,
              addonId,
              shouldOverride ? newPrice : undefined
            );
          }
        }
      }

      showToast('Addon produk berhasil diperbarui', 'success');
      onUpdate();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Gagal menyimpan perubahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center text-slate-500">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">
            Kelola Addon untuk {product.name}
          </h2>
          <p className="text-slate-600 mt-1">
            Pilih addon yang tersedia untuk produk ini
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {allAddons.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Belum ada addon yang tersedia</p>
              <p className="text-sm mt-2">
                Buat addon terlebih dahulu di halaman Addon Produk
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allAddons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                const overridePrice = priceOverrides[addon.id] ?? addon.price;
                const hasOverride = overridePrice !== addon.price;

                return (
                  <div
                    key={addon.id}
                    className={`border rounded-lg p-4 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleAddon(addon.id)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{addon.name}</h3>
                            {addon.description && (
                              <p className="text-sm text-slate-600 mt-1">
                                {addon.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-500">
                              Harga default: Rp {Number(addon.price).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Harga Override (opsional)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={overridePrice}
                                onChange={(e) =>
                                  handlePriceOverrideChange(addon.id, e.target.value)
                                }
                                min="0"
                                step="100"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Kosongkan untuk menggunakan harga default"
                              />
                              <span className="text-sm text-slate-600">Rp</span>
                            </div>
                            {hasOverride && (
                              <p className="text-xs text-indigo-600 mt-1">
                                Override aktif: Rp {Number(overridePrice).toLocaleString('id-ID')}
                              </p>
                            )}
                            {!hasOverride && (
                              <p className="text-xs text-slate-500 mt-1">
                                Menggunakan harga default
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

