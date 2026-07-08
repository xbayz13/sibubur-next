'use client';

import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
}

export default function Card({
  children,
  title,
  description,
  headerActions,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
      {...props}
    >
      {(title || description || headerActions) && (
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
          <div>
            {title && (
              <h3 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
