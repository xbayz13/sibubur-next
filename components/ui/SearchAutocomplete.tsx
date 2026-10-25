'use client';

import { useState, useEffect, useRef } from 'react';
import { createFuzzySearch } from '@/lib/utils/fuzzy-search';

interface SearchAutocompleteProps<T> {
  items: T[];
  searchKeys: string[];
  onSelect: (item: T) => void;
  placeholder?: string;
  renderItem?: (item: T) => React.ReactNode;
  recentItemsKey?: string; // localStorage key for recent items
  maxRecentItems?: number;
  disabled?: boolean;
}

export default function SearchAutocomplete<T extends { id: number | string; name: string }>({
  items,
  searchKeys,
  onSelect,
  placeholder = 'Search...',
  renderItem,
  recentItemsKey,
  maxRecentItems = 8,
  disabled = false,
}: SearchAutocompleteProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [recentItems, setRecentItems] = useState<T[]>(() => {
    // Lazy initial state - load from localStorage
    if (recentItemsKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(recentItemsKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load recent items:', error);
      }
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fuzzy search handler
  const handleSearch = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (!value || value.trim() === '') {
      setResults([]);
      return;
    }

    const search = createFuzzySearch(items, searchKeys, 0.4);
    const searchResults = search(value).map((r) => r.item).slice(0, 10);
    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
  };

  // Handle item selection
  const handleSelect = (item: T) => {
    // Save to recent items
    if (recentItemsKey && typeof window !== 'undefined') {
      try {
        const updated = [
          item,
          ...recentItems.filter((i) => i.id !== item.id),
        ].slice(0, maxRecentItems);
        localStorage.setItem(recentItemsKey, JSON.stringify(updated));
        setRecentItems(updated);
      } catch (error) {
        console.error('Failed to save recent item:', error);
      }
    }

    // Call parent handler
    onSelect(item);

    // Reset state
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const displayItems = query ? results : recentItems;

    if (!isOpen || displayItems.length === 0) {
      if (e.key === 'Enter' && query) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < displayItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : displayItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < displayItems.length) {
          handleSelect(displayItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && menuRef.current) {
      const selectedElement = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  const displayItems = query ? results : recentItems;
  const showDropdown = isOpen && displayItems.length > 0;

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (recentItems.length > 0 || results.length > 0) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full h-12 px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Search"
          aria-autocomplete="list"
          aria-controls="search-results"
        />

        {/* Clear button */}
        {query && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
       {showDropdown && (
         <div
           ref={menuRef}
           id="search-results"
           role="listbox"
           className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
         >
          {/* Header for recent items */}
          {!query && recentItems.length > 0 && (
            <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              Recent Searches
            </div>
          )}

          {displayItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={idx === selectedIndex}
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                idx === selectedIndex
                  ? 'bg-brand-50 dark:bg-brand-500/10 border-l-2 border-brand-500'
                  : ''
              } ${idx === 0 ? '' : 'border-t border-gray-100 dark:border-gray-800'}`}
            >
              {renderItem ? (
                renderItem(item)
              ) : (
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
