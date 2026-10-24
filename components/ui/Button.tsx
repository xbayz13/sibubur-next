'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'outline' | 'danger';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  loadingText?: string;
}

const Spinner = ({ color = 'white' }: { color?: string }) => (
  <svg
    className={`animate-spin h-4 w-4 text-${color}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function Button({
  children,
  size = 'md',
  variant = 'primary',
  startIcon,
  endIcon,
  className = '',
  disabled = false,
  loading = false,
  loadingText,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',   /* 16px horiz (space-4), 8px vert (space-2) */
    md: 'px-6 py-4 text-base', /* 24px horiz (space-6), 16px vert (space-4) */
  };

  const variantClasses = {
    primary:
      'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300',
    outline:
      'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300',
    danger:
      'bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300',
  };

  const spinnerColor = variant === 'outline' ? 'gray-500' : 'white';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled || loading ? 'cursor-not-allowed opacity-50' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner color={spinnerColor} />
          {loadingText || children}
        </>
      ) : (
        <>
          {startIcon && <span className="flex items-center">{startIcon}</span>}
          {children}
          {endIcon && <span className="flex items-center">{endIcon}</span>}
        </>
      )}
    </button>
  );
}
