'use client';

import { useEffect } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  // Keyboard navigation (arrow keys) - must be before early return
  useEffect(() => {
    // Only listen if pagination is visible
    if (totalPages <= 1 && total <= limit) return;
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && page > 1) {
        e.preventDefault();
        onPageChange(page - 1);
      } else if (e.key === 'ArrowRight' && page < totalPages) {
        e.preventDefault();
        onPageChange(page + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages, total, limit, onPageChange, disabled]);

  // Hide pagination if only 1 page or less
  if (totalPages <= 1 && total <= limit) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers with ellipsis logic
  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    
    // If 7 or fewer pages, show all
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const leftBoundary = 2;
    const rightBoundary = totalPages - 1;
    const showLeft = page > 4;
    const showRight = page < totalPages - 3;

    if (showLeft && page > leftBoundary + 1) {
      pages.push('...');
    }

    // Show pages around current page
    const startPage = Math.max(leftBoundary, page - 1);
    const endPage = Math.min(rightBoundary, page + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (showRight && page < rightBoundary - 1) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Info text */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Menampilkan <span className="font-medium text-gray-900 dark:text-white">{startItem}-{endItem}</span> dari{' '}
        <span className="font-medium text-gray-900 dark:text-white">{total}</span> data
      </div>

      {/* Page numbers navigation */}
      <nav className="flex items-center gap-2" aria-label="Pagination">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || disabled}
          aria-label="Previous page"
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition-colors"
        >
          Sebelumnya
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-2">
          {pageNumbers.map((pageNum, idx) =>
            pageNum === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-gray-500 dark:text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                disabled={disabled}
                aria-label={`Page ${pageNum}`}
                aria-current={page === pageNum ? 'page' : undefined}
                className={`min-w-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  page === pageNum
                    ? 'bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {/* Mobile: show current page only */}
        <div className="sm:hidden px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
          Hal. <span className="font-medium text-gray-900 dark:text-white">{page}</span> dari{' '}
          <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || disabled}
          aria-label="Next page"
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition-colors"
        >
          Selanjutnya
        </button>
      </nav>
    </div>
  );
}
