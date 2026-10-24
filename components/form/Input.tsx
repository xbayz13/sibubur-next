'use client';

import { InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean; // String for error message, boolean for backward compatibility
  success?: boolean;
  hint?: string;
  validator?: (value: string) => string | null; // Validator function
}

export default function Input({
  type = 'text',
  className = '',
  disabled = false,
  success = false,
  error,
  hint,
  validator,
  onBlur,
  onChange,
  value,
  ...props
}: InputProps) {
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    
    // Run validator if provided
    if (validator && e.target.value) {
      const errorMsg = validator(e.target.value);
      setValidationError(errorMsg);
    }
    
    // Call parent onBlur if provided
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Call parent onChange first
    if (onChange) {
      onChange(e);
    }
    
    // Real-time validation if already touched
    if (touched && validator) {
      const errorMsg = validator(e.target.value);
      setValidationError(errorMsg);
    }
  };

  // Determine current state - handle both boolean and string error
  const currentError = touched 
    ? (validationError || (typeof error === 'string' ? error : undefined))
    : (typeof error === 'string' ? error : undefined);
  const hasError = Boolean(currentError) || (typeof error === 'boolean' ? error : false);
  const isValid = touched && !validationError && !error && value && String(value).length > 0;

  let inputClasses = `h-12 w-full rounded-lg border appearance-none px-4 py-3.5 text-base shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 transition-colors ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (hasError) {
    inputClasses += ` border-2 border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-white/90 dark:border-error-500 dark:focus:border-error-600`;
  } else if (isValid || success) {
    inputClasses += ` border-2 border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-white/90 dark:border-success-500 dark:focus:border-success-600`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <input
        type={type}
        disabled={disabled}
        className={inputClasses}
        onBlur={handleBlur}
        onChange={handleChange}
        value={value}
        {...props}
      />
      
      {/* Success checkmark icon */}
      {(isValid || success) && !hasError && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-success-500 dark:text-success-400 text-lg font-bold">
          ✓
        </span>
      )}
      
      {/* Error icon */}
      {hasError && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-error-500 dark:text-error-400 text-lg font-bold">
          ✕
        </span>
      )}
      
      {/* Hint or error message */}
      {(currentError || hint) && (
        <p
          className={`mt-1.5 text-xs ${
            hasError
              ? 'text-error-500 dark:text-error-400'
              : isValid || success
              ? 'text-success-500 dark:text-success-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {currentError || hint}
        </p>
      )}
    </div>
  );
}
