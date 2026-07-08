'use client';

import { ReactNode, LabelHTMLAttributes } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export default function Label({ children, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`mb-2.5 block text-base font-medium text-gray-700 dark:text-gray-300 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
