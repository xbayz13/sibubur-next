'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname();

  const defaultItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/', current: pathname === '/' }
  ];

  // Generate breadcrumbs from pathname if not provided
  if (!items) {
    const segments = pathname.split('/').filter(Boolean);
    
    segments.forEach((segment, idx) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      defaultItems.push({
        label,
        href,
        current: idx === segments.length - 1
      });
    });

    items = defaultItems;
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center space-x-2">
          {idx > 0 && (
            <span className="text-slate-400 dark:text-slate-600">/</span>
          )}
          {item.current ? (
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
