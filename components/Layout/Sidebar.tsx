'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { MENU_ITEMS, getPermissionsForMenuItem, hasAnyPermission } from '@/lib/permissions';
import {
  GridIcon,
  ChevronDownIcon,
  UserCircleIcon,
  HorizontalDotsIcon,
  TableIcon,
  CashierIcon,
  OpenOrdersIcon,
  ProductionIcon,
  TransactionIcon,
  InventoryIcon,
  ExpenseIcon,
  ReportIcon,
  DatabaseIcon,
  UserIcon,
  KeyIcon,
  SettingsIcon,
} from '@/components/icons';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

// Map menu items dengan icons
const mapMenuItemToIcon = (name: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    'Dashboard': <GridIcon />,
    'Kasir': <CashierIcon />,
    'Pesanan Terbuka': <OpenOrdersIcon />,
    'Produksi Harian': <ProductionIcon />,
    'Pesanan': <TableIcon />,
    'Transaksi': <TransactionIcon />,
    'Persediaan': <InventoryIcon />,
    'Pengeluaran': <ExpenseIcon />,
    'Karyawan': <UserCircleIcon />,
    'Laporan': <ReportIcon />,
    'Data Master': <DatabaseIcon />,
    'Pengguna': <UserIcon />,
    'Role & Izin': <KeyIcon />, // legacy label
    'Pengaturan Hak Akses': <KeyIcon />,
    'Pengaturan': <SettingsIcon />,
  };
  return iconMap[name] || <GridIcon />;
};

// Master data submenu
const masterDataSubItems = [
  { name: 'Produk', path: '/master-data/products' },
  { name: 'Kategori Produk', path: '/master-data/product-categories' },
  { name: 'Addon Produk', path: '/master-data/product-addons' },
  { name: 'Toko', path: '/master-data/stores' },
  { name: 'Karyawan', path: '/master-data/employees' },
  { name: 'Kategori Pengeluaran', path: '/master-data/expense-categories' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin, permissions } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileMenu } = useSidebar();

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filter menu items based on permissions
  const visibleMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (isSuperAdmin || user?.role?.name === 'Owner') {
        return true;
      }
      const requiredPermissions = getPermissionsForMenuItem(item.name);
      if (requiredPermissions.length === 0) {
        return true;
      }
      return hasAnyPermission(permissions, requiredPermissions);
    });
  }, [isSuperAdmin, permissions, user?.role?.name]);

  // Grouped navigation for better UX (older users)
  const groupedNav = useMemo(
    () => [
      {
        section: 'Operasional Harian',
        items: ['Dashboard', 'Kasir', 'Pesanan Terbuka', 'Produksi Harian'],
      },
      {
        section: 'Keuangan & Persediaan',
        items: ['Transaksi', 'Pengeluaran', 'Persediaan'],
      },
      {
        section: 'Manajemen',
        items: ['Karyawan', 'Data Master'],
      },
      {
        section: 'Laporan',
        items: ['Laporan'],
      },
      {
        section: 'Pengaturan',
        items: ['Pengguna', 'Pengaturan Hak Akses', 'Pengaturan'],
      },
    ],
    []
  );

  // Build nav items with icons and submenus
  const navItems: NavItem[] = useMemo(
    () =>
      visibleMenuItems.map((item) => {
        if (item.name === 'Data Master') {
          return {
            name: item.name,
            icon: mapMenuItemToIcon(item.name),
            subItems: masterDataSubItems,
          };
        }
        return {
          name: item.name,
          icon: mapMenuItemToIcon(item.name),
          path: item.href,
        };
      }),
    [visibleMenuItems]
  );

  // Helper to get section for an item
  const getSectionForItem = (name: string) => {
    for (const group of groupedNav) {
      if (group.items.includes(name)) return group.section;
    }
    return null;
  };

  const isActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(path + '/'),
    [pathname]
  );

  const activeSubmenu = useMemo(() => {
    for (let index = 0; index < navItems.length; index++) {
      const nav = navItems[index];
      if (nav.subItems?.some((subItem) => isActive(subItem.path))) {
        return `${index}`;
      }
    }
    return null;
  }, [isActive, navItems]);

  const resolvedOpenSubmenu = openSubmenu ?? activeSubmenu;

  // Calculate submenu height
  useEffect(() => {
    if (resolvedOpenSubmenu !== null) {
      const key = resolvedOpenSubmenu;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [navItems, resolvedOpenSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => (prevOpenSubmenu === `${index}` ? null : `${index}`));
  };

  const renderMenuItems = () => {
    const sections: Record<string, typeof navItems> = {};

    navItems.forEach((item) => {
      const section = getSectionForItem(item.name);
      if (!section) return;
      if (!sections[section]) sections[section] = [];
      sections[section].push(item);
    });

    return (
      <div className="flex flex-col gap-6">
        {Object.entries(sections).map(([sectionName, items]) => (
          <div key={sectionName}>
            {(isExpanded || isHovered || isMobileOpen) && (
              <div className="px-3 mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {sectionName}
              </div>
            )}
            <ul className="flex flex-col gap-1">
              {items.map((nav) => {
                const globalIndex = navItems.indexOf(nav);
                return (
                  <li key={nav.name}>
                    {nav.subItems ? (
                      <>
                        <button
                          onClick={() => handleSubmenuToggle(globalIndex)}
                          className={`menu-item group ${
                            resolvedOpenSubmenu === `${globalIndex}` ? 'menu-item-active' : 'menu-item-inactive'
                          } cursor-pointer ${
                            !isExpanded && !isHovered ? 'md:justify-center' : 'md:justify-start'
                          }`}
                        >
                          <span
                            className={`menu-item-icon-size ${
                              resolvedOpenSubmenu === `${globalIndex}` ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                            }`}
                          >
                            {nav.icon}
                          </span>
                          {(isExpanded || isHovered || isMobileOpen) && (
                            <>
                              <span className="menu-item-text">{nav.name}</span>
                              <ChevronDownIcon
                                className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                                  resolvedOpenSubmenu === `${globalIndex}` ? 'rotate-180 text-brand-500' : ''
                                }`}
                              />
                            </>
                          )}
                        </button>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <div
                            ref={(el) => {
                              subMenuRefs.current[`${globalIndex}`] = el;
                            }}
                            className="overflow-hidden transition-all duration-300"
                            style={{
                              height: resolvedOpenSubmenu === `${globalIndex}` ? `${subMenuHeight[`${globalIndex}`]}px` : '0px',
                            }}
                          >
                            <ul className="mt-1 space-y-1 ml-9">
                              {nav.subItems.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    href={subItem.path}
                                    className={`menu-dropdown-item ${
                                      isActive(subItem.path)
                                        ? 'menu-dropdown-item-active'
                                        : 'menu-dropdown-item-inactive'
                                    }`}
                                    onClick={closeMobileMenu}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      nav.path && (
                        <Link
                          href={nav.path}
                          className={`menu-item group ${
                            isActive(nav.path) ? 'menu-item-active' : 'menu-item-inactive'
                          }`}
                          onClick={closeMobileMenu}
                        >
                          <span
                            className={`menu-item-icon-size ${
                              isActive(nav.path) ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                            }`}
                          >
                            {nav.icon}
                          </span>
                          {(isExpanded || isHovered || isMobileOpen) && (
                            <span className="menu-item-text">{nav.name}</span>
                          )}
                        </Link>
                      )
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
          ${
            isExpanded || isMobileOpen
              ? 'w-[290px]'
              : isHovered
              ? 'w-[290px]'
              : 'w-[90px]'
          }
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`py-8 flex ${
            !isExpanded && !isHovered ? 'md:justify-center' : 'justify-start'
          }`}
        >
          <Link href="/" className="flex items-center gap-3">
            {(isExpanded || isHovered || isMobileOpen) ? (
              <>
                <Image
                  src="/sibubur-high-resolution-logo-transparent.png"
                  alt="SiBubur Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-800 dark:text-white">SiBubur</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Point of Sale</p>
                </div>
              </>
            ) : (
              <Image
                src="/sibubur-high-resolution-logo-transparent.png"
                alt="SiBubur Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            )}
          </Link>
        </div>

        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered ? 'md:justify-center' : 'justify-start'
                  }`}
                >
                  {(isExpanded || isHovered || isMobileOpen) ? (
                    'Menu'
                  ) : (
                    <HorizontalDotsIcon className="size-6" />
                  )}
                </h2>
                {renderMenuItems()}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className={`border-t border-gray-200 dark:border-gray-800 flex-shrink-0 ${isExpanded || isHovered || isMobileOpen ? 'p-4' : 'p-3'}`}>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">Logged in as</p>
              <p className="font-semibold text-gray-800 dark:text-white truncate" title={user?.username}>
                {user?.username}
              </p>
            </div>
          )}
          {!isExpanded && !isHovered && !isMobileOpen && (
            <div className="mb-4 flex justify-center">
              <div
                className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center cursor-default"
                title={user?.username || 'User'}
              >
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full bg-error-500 hover:bg-error-600 rounded-lg transition-colors text-white font-medium flex items-center justify-center ${
              isExpanded || isHovered || isMobileOpen
                ? 'px-4 py-2 text-sm'
                : 'px-3 py-3'
            }`}
            title={!isExpanded && !isHovered && !isMobileOpen ? 'Logout' : undefined}
          >
            {(isExpanded || isHovered || isMobileOpen) ? (
              'Logout'
            ) : (
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
