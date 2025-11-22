'use client';

import { useState, useEffect } from 'react';
import { Store, Supply, Weather } from '@/types';
import { CreateProductionDto } from '@/lib/services/productions';
import { weatherService } from '@/lib/services/weather';
import { bmkgService } from '@/lib/services/bmkg';

interface ProductionFormProps {
  stores: Store[];
  supplies: Supply[];
  defaultStoreId?: number;
  defaultDate?: string;
  recommendations?: any;
  onSubmit: (production: CreateProductionDto) => void;
  onCancel: () => void;
}

interface ProductionSupply {
  supplyId: number;
  quantity: number;
}

export default function ProductionForm({
  stores,
  supplies,
  defaultStoreId,
  defaultDate,
  recommendations,
  onSubmit,
  onCancel,
}: ProductionFormProps) {
  const [date, setDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0]);
  const [storeId, setStoreId] = useState<number>(defaultStoreId || stores[0]?.id || 0);
  const [porridgeAmount, setPorridgeAmount] = useState<string>(
    recommendations?.recommendedAmount?.toString() || ''
  );
  const [weatherId, setWeatherId] = useState<number | undefined>();
  const [existingWeather, setExistingWeather] = useState<Weather | null>(null);
  const [bmkgWeather, setBmkgWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [productionSupplies, setProductionSupplies] = useState<ProductionSupply[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingWeather();
    loadBMKGWeather();
  }, [date]);

  const checkExistingWeather = async () => {
    try {
      const weather = await weatherService.getByDate(date);
      if (weather) {
        setExistingWeather(weather);
        setWeatherId(weather.id);
      } else {
        setExistingWeather(null);
      }
    } catch (error) {
      setExistingWeather(null);
    }
  };

  const loadBMKGWeather = async () => {
    try {
      setLoadingWeather(true);
      const forecast = await bmkgService.getForecast();
      // Get weather for the selected date
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let weatherData = null;
      if (daysDiff === 0) {
        // Today - use current weather
        weatherData = forecast.current;
      } else if (daysDiff === 1) {
        // Tomorrow - use first forecast from tomorrow
        weatherData = forecast.forecasts.tomorrow[0] || null;
      } else if (daysDiff === 2) {
        // Day after tomorrow
        weatherData = forecast.forecasts.dayAfter[0] || null;
      }
      
      if (weatherData) {
        setBmkgWeather(weatherData);
      }
    } catch (error) {
      console.error('Failed to load BMKG weather:', error);
      setBmkgWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  const addSupply = () => {
    setProductionSupplies([...productionSupplies, { supplyId: 0, quantity: 0 }]);
  };

  const removeSupply = (index: number) => {
    setProductionSupplies(productionSupplies.filter((_, i) => i !== index));
  };

  const updateSupply = (index: number, updates: Partial<ProductionSupply>) => {
    const newSupplies = [...productionSupplies];
    newSupplies[index] = { ...newSupplies[index], ...updates };
    setProductionSupplies(newSupplies);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalWeatherId = weatherId;

      // Create weather from BMKG data if not exists
      if (!existingWeather && bmkgWeather) {
        const mappedCondition = bmkgService.mapConditionToFormat(bmkgWeather.condition);
        const newWeather = await weatherService.create({
          date,
          condition: mappedCondition,
          description: bmkgWeather.condition,
          temperature: bmkgWeather.temperature,
        });
        finalWeatherId = newWeather.id;
      }

      const productionData: CreateProductionDto = {
        date,
        storeId,
        porridgeAmount: porridgeAmount ? Number(porridgeAmount) : undefined,
        weatherId: finalWeatherId,
        supplies: productionSupplies.filter((s) => s.supplyId > 0 && s.quantity > 0),
      };

      onSubmit(productionData);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan produksi');
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = () => {
    if (recommendations?.recommendedAmount) {
      setPorridgeAmount(recommendations.recommendedAmount.toString());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Catat Produksi Baru</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                />
              </div>

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
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Jumlah Bubur yang Diproduksi (kg)
                </label>
                {recommendations && (
                  <button
                    type="button"
                    onClick={applyRecommendation}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Gunakan Rekomendasi ({recommendations.recommendedAmount} kg)
                  </button>
                )}
              </div>
              <input
                type="number"
                value={porridgeAmount}
                onChange={(e) => setPorridgeAmount(e.target.value)}
                min="0"
                step="0.5"
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Masukkan jumlah dalam kg"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Data Cuaca</h3>

              {loadingWeather ? (
                <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-600">
                  Memuat data cuaca dari BMKG...
                </div>
              ) : existingWeather ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-700 font-medium">✓ Data cuaca sudah tersimpan</span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <div>Kondisi: <span className="font-medium">{existingWeather.condition}</span></div>
                    {existingWeather.description && (
                      <div>Deskripsi: {existingWeather.description}</div>
                    )}
                    {existingWeather.temperature && (
                      <div>Suhu: {existingWeather.temperature}°C</div>
                    )}
                  </div>
                </div>
              ) : bmkgWeather ? (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-700 font-medium">🌤️ Data cuaca dari BMKG</span>
                  </div>
                  <div className="text-sm text-slate-700 space-y-1">
                    <div>Kondisi: <span className="font-medium">{bmkgWeather.condition}</span></div>
                    <div>Suhu: <span className="font-medium">{bmkgWeather.temperature}°C</span></div>
                    {bmkgWeather.humidity && (
                      <div>Kelembaban: {bmkgWeather.humidity}%</div>
                    )}
                    {bmkgWeather.precipitation > 0 && (
                      <div className="text-rose-600 font-medium">
                        ⚠️ Curah hujan: {bmkgWeather.precipitation} mm
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Data cuaca akan otomatis disimpan saat produksi dicatat
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    ⚠️ Data cuaca tidak tersedia. Silakan coba lagi atau catat produksi tanpa data cuaca.
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-slate-800">Persediaan yang Digunakan</h3>
                <button
                  type="button"
                  onClick={addSupply}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Tambah Persediaan
                </button>
              </div>

              <div className="space-y-2">
                {productionSupplies.map((supply, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600 mb-1">Persediaan</label>
                      <select
                        value={supply.supplyId}
                        onChange={(e) =>
                          updateSupply(index, { supplyId: Number(e.target.value) })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      >
                        <option value={0}>Pilih Persediaan</option>
                        {supplies.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.unit}) - Stok: {s.stock}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-slate-600 mb-1">Jumlah</label>
                      <input
                        type="number"
                        value={supply.quantity || ''}
                        onChange={(e) =>
                          updateSupply(index, { quantity: Number(e.target.value) })
                        }
                        min="0"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSupply(index)}
                      className="text-rose-600 hover:text-rose-700 px-3 py-2"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                {productionSupplies.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Belum ada persediaan ditambahkan (opsional)
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Produksi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

