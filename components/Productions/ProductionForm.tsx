'use client';

import { useState, useEffect } from 'react';
import { Store, Supply, Weather } from '@/types';
import { CreateProductionDto } from '@/lib/services/productions';
import { weatherService } from '@/lib/services/weather';

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
  const [createNewWeather, setCreateNewWeather] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'cloudy' | 'rainy' | 'stormy'>('sunny');
  const [weatherDescription, setWeatherDescription] = useState('');
  const [weatherTemperature, setWeatherTemperature] = useState<string>('');
  const [productionSupplies, setProductionSupplies] = useState<ProductionSupply[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingWeather();
  }, [date]);

  const checkExistingWeather = async () => {
    try {
      const weather = await weatherService.getByDate(date);
      if (weather) {
        setExistingWeather(weather);
        setWeatherId(weather.id);
        setCreateNewWeather(false);
      } else {
        setExistingWeather(null);
        setCreateNewWeather(true);
      }
    } catch (error) {
      setExistingWeather(null);
      setCreateNewWeather(true);
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

      // Create weather if needed
      if (createNewWeather && !existingWeather) {
        const newWeather = await weatherService.create({
          date,
          condition: weatherCondition,
          description: weatherDescription || undefined,
          temperature: weatherTemperature ? Number(weatherTemperature) : undefined,
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
                  Jumlah Bubur yang Diproduksi (porsi)
                </label>
                {recommendations && (
                  <button
                    type="button"
                    onClick={applyRecommendation}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Gunakan Rekomendasi ({recommendations.recommendedAmount} porsi)
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
                placeholder="Masukkan jumlah porsi"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Data Cuaca</h3>

              {existingWeather && !createNewWeather ? (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        Cuaca: {existingWeather.condition}
                      </div>
                      {existingWeather.description && (
                        <div className="text-sm text-slate-600">
                          {existingWeather.description}
                        </div>
                      )}
                      {existingWeather.temperature && (
                        <div className="text-sm text-slate-600">
                          Suhu: {existingWeather.temperature}°C
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateNewWeather(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Ubah
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Kondisi Cuaca *
                    </label>
                    <select
                      value={weatherCondition}
                      onChange={(e) =>
                        setWeatherCondition(
                          e.target.value as 'sunny' | 'cloudy' | 'rainy' | 'stormy'
                        )
                      }
                      required
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    >
                      <option value="sunny">Cerah</option>
                      <option value="cloudy">Berawan</option>
                      <option value="rainy">Hujan</option>
                      <option value="stormy">Badai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Suhu (°C)
                    </label>
                    <input
                      type="number"
                      value={weatherTemperature}
                      onChange={(e) => setWeatherTemperature(e.target.value)}
                      step="0.1"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="Opsional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Deskripsi
                    </label>
                    <textarea
                      value={weatherDescription}
                      onChange={(e) => setWeatherDescription(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="Deskripsi cuaca (opsional)"
                    />
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

