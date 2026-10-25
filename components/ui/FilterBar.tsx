'use client';

import React from 'react';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  options?: { label: string; value: string | number }[];
}

interface FilterBarProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  filterConfigs: FilterConfig[];
  onClear: () => void;
}

export default function FilterBar({
  filters,
  onFilterChange,
  filterConfigs,
  onClear,
}: FilterBarProps) {
  const activeFilters = Object.values(filters).filter(v => v).length;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Filter
            {activeFilters > 0 && (
              <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded-full">
                {activeFilters} aktif
              </span>
            )}
          </h3>
          {activeFilters > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline"
            >
              Bersihkan semua
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filterConfigs.map((config) => (
            <div key={config.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {config.label}
              </label>
              {config.type === 'text' && (
                <input
                  type="text"
                  placeholder={config.placeholder || 'Cari...'}
                  value={filters[config.key] || ''}
                  onChange={(e) => onFilterChange(config.key, e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                />
              )}
              {config.type === 'select' && (
                <select
                  value={filters[config.key] || ''}
                  onChange={(e) => onFilterChange(config.key, e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                >
                  <option value="">Semua</option>
                  {config.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {config.type === 'date' && (
                <input
                  type="date"
                  value={filters[config.key] || ''}
                  onChange={(e) => onFilterChange(config.key, e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
