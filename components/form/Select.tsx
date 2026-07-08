'use client';

import { SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from '@/components/icons';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: Option[];
  placeholder?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  success?: boolean;
  hint?: string;
}

export default function Select({
  options,
  placeholder = 'Select an option',
  onChange,
  className = '',
  error = false,
  success = false,
  hint,
  value,
  defaultValue,
  ...props
}: SelectProps) {
  let selectClasses = `h-12 w-full appearance-none rounded-lg border bg-transparent px-4 py-3.5 pr-11 text-base shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (error) {
    selectClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    selectClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    selectClasses += ` border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800`;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative">
      <select
        className={selectClasses}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        {...props}
      >
        <option value="" disabled className="text-gray-400 dark:text-gray-500">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-800 dark:text-white/90 dark:bg-gray-900"
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? 'text-error-500'
              : success
              ? 'text-success-500'
              : 'text-gray-500'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
