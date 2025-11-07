// Permission mapping for menu items and pages
export const PERMISSION_SLUGS = {
  DASHBOARD: 'dashboard:view',
  CASHIER: 'cashier:view',
  OPEN_ORDERS: 'orders:view',
  PRODUCTION: 'productions:view',
  ORDERS: 'orders:view',
  TRANSACTIONS: 'transactions:view',
  SUPPLIES: 'supplies:view',
  EXPENSES: 'expenses:view',
  EMPLOYEES: 'employees:view',
  REPORTS: 'reports:view',
  MASTER_DATA: 'master-data:view',
  USERS: 'users:view',
  ROLES: 'roles:view',
} as const;

// Menu items with their permission requirements
export const MENU_ITEMS = [
  { name: 'Dashboard', href: '/', icon: '📊', permission: PERMISSION_SLUGS.DASHBOARD },
  { name: 'Kasir', href: '/cashier', icon: '💳', permission: PERMISSION_SLUGS.CASHIER },
  { name: 'Pesanan Terbuka', href: '/open-orders', icon: '🛒', permission: PERMISSION_SLUGS.OPEN_ORDERS },
  { name: 'Produksi Harian', href: '/productions', icon: '🍲', permission: PERMISSION_SLUGS.PRODUCTION },
  { name: 'Pesanan', href: '/orders', icon: '📝', permission: PERMISSION_SLUGS.ORDERS },
  { name: 'Transaksi', href: '/transactions', icon: '💰', permission: PERMISSION_SLUGS.TRANSACTIONS },
  { name: 'Persediaan', href: '/supplies', icon: '📦', permission: PERMISSION_SLUGS.SUPPLIES },
  { name: 'Pengeluaran', href: '/expenses', icon: '💸', permission: PERMISSION_SLUGS.EXPENSES },
  { name: 'Karyawan', href: '/employees', icon: '👥', permission: PERMISSION_SLUGS.EMPLOYEES },
  { name: 'Laporan', href: '/reports', icon: '📈', permission: PERMISSION_SLUGS.REPORTS },
  { name: 'Data Master', href: '/master-data', icon: '⚙️', permission: PERMISSION_SLUGS.MASTER_DATA },
  { name: 'Pengguna', href: '/users', icon: '👤', permission: PERMISSION_SLUGS.USERS },
  { name: 'Role & Izin', href: '/roles', icon: '🔐', permission: PERMISSION_SLUGS.ROLES },
] as const;

// Helper function to check if user has permission
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // SuperAdmin has all permissions
  if (userPermissions.includes('superadmin:*')) {
    return true;
  }
  return userPermissions.includes(requiredPermission);
}

// Get permission slug for a route
export function getPermissionForRoute(route: string): string | null {
  const item = MENU_ITEMS.find((item) => route === item.href || route.startsWith(item.href + '/'));
  return item?.permission || null;
}

