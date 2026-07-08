/**
 * Frontend permission mapping and utilities
 */

// Route to permission mapping for frontend
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/': ['dashboard.read'],
  '/cashier': ['cashier.read', 'cashier.create'],
  '/open-orders': ['orders.read'],
  '/productions': ['productions.read', 'productions.create', 'productions.update'],
  '/orders': ['orders.read', 'orders.update'],
  '/transactions': ['transactions.read'],
  '/supplies': ['supplies.read', 'supplies.update'],
  '/expenses': ['expenses.read', 'expenses.create', 'expenses.update', 'expenses.delete'],
  '/employees': ['employees.read', 'employees.create', 'employees.update', 'employees.delete', 'attendances.read', 'attendances.create', 'attendances.update'],
  '/reports': ['reports.read'],
  '/master-data/products': ['products.read', 'products.create', 'products.update', 'products.delete'],
  '/master-data/product-categories': ['product-categories.read', 'product-categories.create', 'product-categories.update', 'product-categories.delete'],
  '/master-data/product-addons': ['product-addons.read', 'product-addons.create', 'product-addons.update', 'product-addons.delete'],
  '/master-data/stores': ['stores.read', 'stores.create', 'stores.update', 'stores.delete'],
  '/master-data/employees': ['employees.read', 'employees.create', 'employees.update', 'employees.delete'],
  '/master-data/expense-categories': ['expense-categories.read', 'expense-categories.create', 'expense-categories.update', 'expense-categories.delete'],
  '/users': ['users.read', 'users.create', 'users.update', 'users.delete'],
  '/roles': ['roles.read', 'roles.create', 'roles.update', 'roles.delete'],
  '/roles/[id]/permissions': ['roles.update'],
  '/permissions': ['permissions.read'],
  '/settings': [],
};

// Menu items with their required permissions
const MENU_ITEMS_PERMISSIONS: Record<string, string[]> = {
  'Dashboard': ['dashboard.read'],
  'Kasir': ['cashier.read'],
  'Pesanan Terbuka': ['orders.read'],
  'Produksi Harian': ['productions.read'],
  'Transaksi': ['transactions.read'],
  'Pengeluaran': ['expenses.read'],
  'Persediaan': ['supplies.read'],
  'Karyawan': ['employees.read'],
  'Data Master': ['products.read', 'stores.read', 'product-categories.read', 'product-addons.read', 'employees.read', 'expense-categories.read'],
  'Laporan': ['reports.read'],
  'Pengguna': ['users.read'],
  'Pengaturan Hak Akses': ['roles.read'],
  'Pengaturan': [],
};

/**
 * Get required permissions for a route
 */
export function getPermissionsForRoute(route: string): string[] {
  // Check exact match first
  if (ROUTE_PERMISSIONS[route]) {
    return ROUTE_PERMISSIONS[route];
  }

  // Check if route starts with any mapped route
  for (const [mappedRoute, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.startsWith(mappedRoute)) {
      return permissions;
    }
  }

  // For master-data sub-routes
  if (route.startsWith('/master-data/')) {
    const parts = route.split('/');
    if (parts.length >= 3) {
      const subRoute = `/master-data/${parts[2]}`;
      if (ROUTE_PERMISSIONS[subRoute]) {
        return ROUTE_PERMISSIONS[subRoute];
      }
    }
  }

  return [];
}

/**
 * Get required permissions for a menu item
 */
export function getPermissionsForMenuItem(menuName: string): string[] {
  return MENU_ITEMS_PERMISSIONS[menuName] || [];
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  // SuperAdmin has all permissions
  if (userPermissions.includes('superadmin:*')) {
    return true;
  }

  // Check if user has any of the required permissions
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  // SuperAdmin has all permissions
  if (userPermissions.includes('superadmin:*')) {
    return true;
  }

  // Check if user has all required permissions
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Menu items configuration
 */
export const MENU_ITEMS = [
  // Operasional Harian
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Kasir', href: '/cashier', icon: '💳' },
  { name: 'Pesanan Terbuka', href: '/open-orders', icon: '🛒' },
  { name: 'Produksi Harian', href: '/productions', icon: '🍲' },

  // Keuangan & Persediaan
  { name: 'Transaksi', href: '/transactions', icon: '💰' },
  { name: 'Pengeluaran', href: '/expenses', icon: '💸' },
  { name: 'Persediaan', href: '/supplies', icon: '📦' },

  // Manajemen
  { name: 'Karyawan', href: '/employees', icon: '👥' },
  { name: 'Data Master', href: '/master-data', icon: '⚙️' },

  // Laporan
  { name: 'Laporan', href: '/reports', icon: '📈' },

  // Pengaturan
  { name: 'Pengguna', href: '/users', icon: '👤' },
  { name: 'Pengaturan Hak Akses', href: '/roles', icon: '🔐' },
  { name: 'Pengaturan', href: '/settings', icon: '🔧' },
] as const;
