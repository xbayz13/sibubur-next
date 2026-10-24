'use client';

import { ReactNode, LabelHTMLAttributes } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export default function Label({ children, className = '', required = false, ...props }: LabelProps) {
  return (
    <label
      className={`mb-2.5 block text-base font-medium text-gray-700 dark:text-gray-300 ${className}`}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-error-500 dark:text-error-400" title="Required field">*</span>
      )}
    </label>
  );
}
