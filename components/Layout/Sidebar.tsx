'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { MENU_ITEMS, getPermissionsForMenuItem, hasAnyPermission } from '@/lib/permissions';
import Tooltip from '@/components/ui/Tooltip';
import AvatarPopover from '@/components/ui/AvatarPopover';
import {
  GridIcon,
  ChevronDownIcon,
  UserCircleIcon,
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
    'Role & Izin': <KeyIcon />,
    'Pengaturan Hak Akses': <KeyIcon />,
    'Pengaturan': <SettingsIcon />,
  };
  return iconMap[name] || <GridIcon />;
};

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
  const { user, isSuperAdmin, permissions } = useAuth();
  const { isExpanded, isMobileOpen, closeMobileMenu } = useSidebar();

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const visibleMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (isSuperAdmin || user?.role?.name === 'Owner') return true;
      const requiredPermissions = getPermissionsForMenuItem(item.name);
      return requiredPermissions.length === 0 || hasAnyPermission(permissions, requiredPermissions);
    });
  }, [isSuperAdmin, permissions, user?.role?.name]);

  const groupedNav = useMemo(() => [
    { section: 'Operasional', items: ['Dashboard', 'Kasir', 'Pesanan Terbuka', 'Produksi Harian', 'Pesanan', 'Transaksi'] },
    { section: 'Manajemen', items: ['Persediaan', 'Pengeluaran', 'Karyawan', 'Data Master', 'Laporan'] },
    { section: 'Pengaturan', items: ['Pengguna', 'Pengaturan Hak Akses', 'Pengaturan'] },
  ], []);

  const navItems: NavItem[] = useMemo(() =>
    visibleMenuItems.map((item) => ({
      name: item.name,
      icon: mapMenuItemToIcon(item.name),
      ...(item.name === 'Data Master' ? { subItems: masterDataSubItems } : { path: item.href }),
    })), [visibleMenuItems]
  );

  const getSectionForItem = (name: string) => groupedNav.find(g => g.items.includes(name))?.section;

  const isActive = useCallback((path: string) => pathname === path || pathname.startsWith(path + '/'), [pathname]);

  const activeSubmenu = useMemo(() => {
    const dataMasterIndex = navItems.findIndex(item => item.name === 'Data Master');
    if (dataMasterIndex !== -1 && pathname.startsWith('/master-data')) return `${dataMasterIndex}`;
    for (let i = 0; i < navItems.length; i++) {
      if (navItems[i].subItems?.some(sub => isActive(sub.path))) return `${i}`;
    }
    return null;
  }, [isActive, navItems, pathname]);

  const resolvedOpenSubmenu = openSubmenu ?? activeSubmenu;

  useEffect(() => {
    if (resolvedOpenSubmenu !== null && subMenuRefs.current[resolvedOpenSubmenu]) {
      setSubMenuHeight(prev => ({
        ...prev,
        [resolvedOpenSubmenu]: subMenuRefs.current[resolvedOpenSubmenu]?.scrollHeight || 0
      }));
    }
  }, [navItems, resolvedOpenSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu(prev => prev === `${index}` ? null : `${index}`);
  };

  const renderMenuItems = () => {
    const sections: Record<string, NavItem[]> = {};
    navItems.forEach(item => {
      const s = getSectionForItem(item.name);
      if (s) (sections[s] = sections[s] || []).push(item);
    });

    return (
      <div className="flex flex-col gap-6">
        {Object.entries(sections).map(([name, items]) => (
          <div key={name}>
            {(isExpanded || isMobileOpen) && (
              <div className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest animate-slide-in">
                {name}
              </div>
            )}
            <ul className="flex flex-col gap-1">
              {items.map((nav) => {
                const idx = navItems.indexOf(nav);
                const isSubOpen = resolvedOpenSubmenu === `${idx}`;
                const isNavActive = nav.path ? isActive(nav.path) : isSubOpen;

                const content = (
                  <button
                    onClick={() => nav.subItems ? handleSubmenuToggle(idx) : null}
                    className={`menu-item group ${isNavActive ? 'menu-item-active' : 'menu-item-inactive'} ${
                      !isExpanded ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    <span className={`menu-item-icon-size transition-colors ${isNavActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}`}>
                      {nav.icon}
                    </span>
                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left truncate">{nav.name}</span>
                        {nav.subItems && (
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isSubOpen ? 'rotate-180' : ''}`} />
                        )}
                      </>
                    )}
                  </button>
                );

                return (
                  <li key={nav.name}>
                    {nav.path && !nav.subItems ? (
                      !isExpanded ? (
                        <Tooltip content={nav.name} placement="right">
                          <Link href={nav.path} onClick={closeMobileMenu}>{content}</Link>
                        </Tooltip>
                      ) : (
                        <Link href={nav.path} onClick={closeMobileMenu}>{content}</Link>
                      )
                    ) : (
                      <>
                        {!isExpanded ? (
                          <Tooltip content={nav.name} placement="right">{content}</Tooltip>
                        ) : content}
                        
                        {isExpanded && nav.subItems && (
                          <div
                            ref={el => { subMenuRefs.current[`${idx}`] = el; }}
                            className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                            style={{ height: isSubOpen ? `${subMenuHeight[`${idx}`]}px` : '0px' }}
                          >
                            <ul className="mt-1 ml-9 border-l border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                              {nav.subItems.map((sub) => (
                                <li key={sub.name}>
                                  <Link
                                    href={sub.path}
                                    className={`menu-dropdown-item ${isActive(sub.path) ? 'menu-dropdown-item-active' : 'menu-dropdown-item-inactive'}`}
                                    onClick={closeMobileMenu}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
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
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" onClick={closeMobileMenu} />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-900 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-50 flex flex-col
          ${isExpanded || isMobileOpen ? 'w-[280px]' : 'w-[88px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`h-20 flex items-center px-6 mb-4 ${!isExpanded ? 'justify-center' : 'justify-start'}`}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="shrink-0 transition-transform group-hover:scale-105 duration-300">
              <Image src="/sibubur-high-resolution-logo-transparent.png" alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
            </div>
            {isExpanded && (
              <div className="flex flex-col animate-slide-in">
                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">SiBubur</span>
                <span className="text-[10px] font-medium text-brand-500 uppercase tracking-widest -mt-1">Point of Sale</span>
              </div>
            )}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-3">
          <nav className="py-2">{renderMenuItems()}</nav>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-900">
          <AvatarPopover isExpanded={isExpanded} />
        </div>
      </aside>
    </>
  );
}
