# SiBUBUR Frontend - Move Recommendation + Production Edit UI

**Agent**: OpenCoder (Frontend)  
**Workdir**: `~/Developer/Skripsi/web/frontend`

---

## TASK 1: Move Recommendation from Reports to Productions

### 1.1 REMOVE recommendation section from Reports
File: `components/Reports/DailyReportView.tsx`

**Delete** the entire "Rekomendasi Produksi" section (lines 28-152 approximately):
```tsx
{/* Recommendations */}
{report.recommendations && (
  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 ...">
    ...
  </div>
)}
```

**Also delete**:
- `ProductionRecommendation` type import
- `showDetails` state (if only used by recommendations)
- Any helper functions only used by recommendations (getWeatherLabel, etc.)

### 1.2 UPDATE Productions page recommendation UI
File: `app/productions/page.tsx`

**Current**: Basic recommendation display (lines 218-308)

**Replace with** the GOOD UI from Reports (hybrid dual-unit + collapsible detail):

```tsx
{/* Production Recommendations Section - Above Filters */}
<div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 border border-indigo-200 dark:border-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-gray-50">Rekomendasi Produksi</h2>
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-600 dark:text-gray-300">Tanggal:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100 rounded-lg px-3 py-1 text-sm"
      />
    </div>
  </div>

  {recommendationLoading ? (
    <div className="text-center py-4 text-slate-600 dark:text-gray-300">Memuat rekomendasi...</div>
  ) : recommendations ? (
    <div className="space-y-4">
      {/* Main recommendation - BIG NUMBER */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
            Rekomendasi untuk {new Date(selectedDate).toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          {/* DUAL UNIT DISPLAY */}
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">
              {recommendations.recommendedAmount} porsi
            </div>
            {recommendations.recommendedKgBeras && (
              <div className="text-lg text-indigo-500 dark:text-indigo-400">
                (≈ {recommendations.recommendedKgBeras.toFixed(1)} kg beras)
              </div>
            )}
          </div>
        </div>

        {/* Weather for target day */}
        {recommendations.targetWeather && (
          <div className="text-sm text-slate-600 dark:text-gray-300 mb-3">
            Cuaca besok: <span className="font-medium capitalize">{recommendations.targetWeather.condition}</span>
          </div>
        )}

        {/* Collapsible detail */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200">
            Detail Perhitungan
          </summary>
          <div className="mt-3 space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                <div className="text-slate-600 dark:text-gray-300">Rata-rata Penjualan</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-gray-50">
                  {recommendations.avgSalesForDayOfWeek} porsi/hari
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">
                  {recommendations.targetDayOfWeek === 0 ? 'Minggu' : 
                   recommendations.targetDayOfWeek === 1 ? 'Senin' :
                   recommendations.targetDayOfWeek === 2 ? 'Selasa' :
                   recommendations.targetDayOfWeek === 3 ? 'Rabu' :
                   recommendations.targetDayOfWeek === 4 ? 'Kamis' :
                   recommendations.targetDayOfWeek === 5 ? 'Jumat' : 'Sabtu'}
                </div>
              </div>

              {recommendations.avgConversionRatio && (
                <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                  <div className="text-slate-600 dark:text-gray-300">Conversion Ratio</div>
                  <div className="text-lg font-semibold text-slate-800 dark:text-gray-50">
                    {recommendations.avgConversionRatio.toFixed(1)} porsi/kg
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                <div className="text-slate-600 dark:text-gray-300">Pengali Cuaca</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-gray-50">
                  {(recommendations.weatherMultiplier * 100).toFixed(0)}%
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-gray-900/60 p-3 rounded">
                <div className="text-slate-600 dark:text-gray-300">Data Historis</div>
                <div className="text-sm text-slate-700 dark:text-gray-100">
                  {recommendations.historicalData.productionCount} produksi
                  <br />
                  {recommendations.historicalData.orderCount} pesanan
                  <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    (dari {recommendations.historicalData.lookbackDays} hari terakhir)
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations list */}
            <div className="mt-3">
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Tips:</h4>
              <ul className="space-y-1 text-slate-700 dark:text-gray-100">
                {recommendations.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 dark:text-indigo-300 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  ) : (
    <div className="text-center py-4 text-slate-500 dark:text-gray-400">
      Tidak ada rekomendasi tersedia. Pastikan ada data historis produksi dan penjualan.
    </div>
  )}
</div>
```

Update `ProductionRecommendation` type in productions/page.tsx:
```typescript
type ProductionRecommendation = {
  recommendedAmount: number;
  recommendedKgBeras?: number;
  avgSalesForDayOfWeek: number;
  targetDayOfWeek: number;
  avgConversionRatio?: number;
  targetWeather?: {
    condition?: string;
    description?: string;
  };
  historicalData: {
    productionCount: number;
    orderCount: number;
    lookbackDays: number;
  };
  weatherMultiplier: number;
  recommendations: string[];
};
```

---

## TASK 2: Production Edit UI (Sisa + PortionsSold)

### 2.1 Add Edit button to ProductionList
File: `components/Productions/ProductionList.tsx`

Add edit button per row (if not exists):
```tsx
<button
  onClick={() => onEdit(production)}
  className="text-blue-600 hover:text-blue-800"
>
  Edit
</button>
```

Update props interface:
```typescript
interface ProductionListProps {
  productions: Production[];
  onDelete: (id: number) => void;
  onEdit: (production: Production) => void; // ← ADD
}
```

### 2.2 Create ProductionEditModal component
File: `components/Productions/ProductionEditModal.tsx` (NEW)

```tsx
'use client';

import { useState } from 'react';
import { Production } from '@/types';

interface ProductionEditModalProps {
  production: Production;
  onSave: (id: number, data: { portionsSold: number; remainingPortions: number }) => Promise<void>;
  onClose: () => void;
}

export default function ProductionEditModal({ production, onSave, onClose }: ProductionEditModalProps) {
  const [portionsSold, setPortionsSold] = useState(
    production.portionsSold?.toString() || '0'
  );
  const [remainingPortions, setRemainingPortions] = useState(
    production.remainingPortions?.toString() || '0'
  );
  const [loading, setLoading] = useState(false);

  const porridgeAmount = parseInt(portionsSold || '0') + parseInt(remainingPortions || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(production.id, {
        portionsSold: parseInt(portionsSold),
        remainingPortions: parseInt(remainingPortions),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Edit Produksi {production.date}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jumlah Porsi Terjual
            </label>
            <input
              type="number"
              value={portionsSold}
              onChange={(e) => setPortionsSold(e.target.value)}
              min="0"
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sisa Porsi (default: 0)
            </label>
            <input
              type="number"
              value={remainingPortions}
              onChange={(e) => setRemainingPortions(e.target.value)}
              min="0"
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total Produksi (otomatis)
            </label>
            <div className="text-2xl font-semibold text-indigo-600">
              {porridgeAmount} porsi
            </div>
          </div>

          {production.productionKgBeras && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Input Awal (kg beras)
              </label>
              <div className="text-slate-600">{production.productionKgBeras} kg</div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 2.3 Wire edit modal in Productions page
File: `app/productions/page.tsx`

Add state:
```typescript
const [editingProduction, setEditingProduction] = useState<Production | null>(null);
```

Add handler:
```typescript
const handleUpdateProduction = async (id: number, data: { portionsSold: number; remainingPortions: number }) => {
  try {
    await productionsService.update(id, data);
    showToast('Produksi berhasil diupdate', 'success');
    await reloadProductions();
  } catch (error) {
    showToast(getErrorMessage(error, 'Gagal update produksi'), 'error');
  }
};
```

Render modal:
```tsx
{editingProduction && (
  <ProductionEditModal
    production={editingProduction}
    onSave={handleUpdateProduction}
    onClose={() => setEditingProduction(null)}
  />
)}
```

### 2.4 Update productions service
File: `lib/services/productions.ts`

Add update method (if not exists):
```typescript
async update(id: number, data: { portionsSold?: number; remainingPortions?: number }) {
  return api.patch(`/productions/${id}`, data);
}
```

Update `Production` type:
```typescript
export interface Production {
  // ... existing fields
  portionsSold?: number;
  remainingPortions?: number;
}
```

---

## TASK 3: Test & Verify

```bash
npm run build
npm test
```

Check TypeScript compilation with no errors.

---

## TASK 4: Commit

```bash
git add -A
git -c user.name='Ikhsan Pahdian' -c user.email='ikhsanpahdian@Ikhsans-MacBook-Air.local' \
  commit -m "feat: move recommendation to productions + edit production UI"
git push origin main
```

---

## Expected Files Modified:
- components/Reports/DailyReportView.tsx (remove recommendation)
- app/productions/page.tsx (update recommendation UI + edit modal)
- components/Productions/ProductionList.tsx (add edit button)
- components/Productions/ProductionEditModal.tsx (NEW)
- lib/services/productions.ts (add update method)
- types/index.ts (update Production type)