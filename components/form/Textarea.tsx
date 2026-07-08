'use client';

import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
  hint?: string;
}

export default function Textarea({
  className = '',
  disabled = false,
  success = false,
  error = false,
  hint,
  ...props
}: TextareaProps) {
  let textareaClasses = `min-h-[120px] w-full rounded-lg border appearance-none px-4 py-3.5 text-base shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    textareaClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    textareaClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <textarea
        disabled={disabled}
        className={textareaClasses}
        {...props}
      />
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
