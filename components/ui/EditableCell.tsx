'use client';

import React, { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  value: string | number;
  onSave: (newValue: string) => Promise<void> | void;
  validator?: (value: string) => string | null;
  type?: 'text' | 'number';
  className?: string;
}

export default function EditableCell({
  value,
  onSave,
  validator,
  type = 'text',
  className = '',
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setCurrentValue(String(value));
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (validator) {
      const validationError = validator(currentValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (currentValue === String(value)) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onSave(currentValue);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="relative inline-block w-full">
        <input
          ref={inputRef}
          type={type}
          value={currentValue}
          onChange={(e) => {
            setCurrentValue(e.target.value);
            if (validator) {
              setError(validator(e.target.value));
            } else {
              setError(null);
            }
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
            error ? 'border-rose-500' : 'border-indigo-300'
          }`}
        />
        {error && (
          <div className="absolute left-0 top-full mt-1 z-20 px-2 py-1 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-200 text-xs rounded shadow-md whitespace-nowrap border border-rose-200">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      className={`group cursor-pointer py-1 px-1.5 -mx-1.5 -my-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${className}`}
      title="Klik untuk ubah"
    >
      <span className="truncate">{value}</span>
      <span className="opacity-0 group-hover:opacity-100 text-xs text-indigo-600 dark:text-indigo-400 ml-2 font-medium shrink-0">
        Ubah
      </span>
    </div>
  );
}
