import Fuse from 'fuse.js';

export interface SearchResult<T> {
  item: T;
  refIndex: number;
  score?: number;
  matches?: Array<{
    indices: [number, number][];
    value: string;
    key?: string;
  }>;
}

/**
 * Create a fuzzy search function for any type of items
 * @param items - Array of items to search
 * @param searchKeys - Keys to search within (e.g., ['name', 'category.name'])
 * @param threshold - Search strictness (0.0 = exact, 1.0 = match anything), default 0.3
 * @returns Search function that takes a query string
 */
export const createFuzzySearch = <T extends Record<string, unknown>>(
  items: T[],
  searchKeys: string[],
  threshold: number = 0.3
) => {
  const fuse = new Fuse(items, {
    keys: searchKeys,
    threshold,
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    findAllMatches: false,
  });

  return (query: string): SearchResult<T>[] => {
    if (!query || query.trim() === '') {
      return [];
    }
    return fuse.search(query) as unknown as SearchResult<T>[];
  };
};

/**
 * Search products by name and category
 * Configured with slightly stricter threshold for product search
 */
export const searchProducts = <T extends Record<string, unknown>>(
  products: T[],
  query: string
): SearchResult<T>[] => {
  const search = createFuzzySearch(
    products,
    ['name', 'category.name'],
    0.4 // Slightly stricter for products
  );
  return search(query);
};

/**
 * Debounce function for search input
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds (default 300ms)
 */
export const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};
