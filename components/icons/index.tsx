import React from 'react';

interface IconProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const GridIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5.5 3.25H9V11.25H5.5V3.25Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M15 3.25H18.5V11.25H15V3.25Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5.5 12.75H9V20.75H5.5V12.75Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M15 12.75H18.5V20.75H15V12.75Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const ListIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5.5 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V18.5C20.75 19.7426 19.7426 20.75 18.5 20.75H5.5C4.25736 20.75 3.25 19.7426 3.25 18.5V5.5C3.25 4.25736 4.25736 3.25 5.5 3.25Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7 9C17 9 17 9 17 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M7 14.5C17 14.5 17 14.5 17 14.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className, width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className, width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7 17.5C7 15.5 9 14.5 12 14.5C15 14.5 17 15.5 17 17.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const HorizontalDotsIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="6" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="18" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const TableIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M3.25 8.5H20.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M3.25 13.75H20.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M9.5 3.25V20.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M15 3.25V20.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const BoxCubeIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3.5L20.5 7.5V16.5L12 20.5L3.5 16.5V7.5L12 3.5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 3.5V12M12 12L3.5 7.5M12 12L20.5 7.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const PieChartIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2V12L20.5 12C20.5 6.48 16.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 2C17.52 2 22 6.48 22 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const PlugInIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8.5" y="2.75" width="7" height="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="5.5" y="7.25" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 21.25V18.75" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="9" cy="5.75" r="0.5" fill="currentColor" />
    <circle cx="15" cy="5.75" r="0.5" fill="currentColor" />
  </svg>
);

export const PageIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9.25 3.5H17.75C18.1642 3.5 18.5 3.83579 18.5 4.25V17.5C18.5 17.9142 18.1642 18.25 17.75 18.25H6.25C5.83579 18.25 5.5 17.9142 5.5 17.5V4.25C5.5 3.83579 5.83579 3.5 6.25 3.5H9.25" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M9.25 3.5V6.25H15.75V3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className, width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="9.7" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2.5 9.7C3.5 6 6.5 4 10 4C13.5 4 16.5 6 17.5 9.7C16.5 13.4 13.5 15.4 10 15.4C6.5 15.4 3.5 13.4 2.5 9.7Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EyeCloseIcon: React.FC<IconProps> = ({ className, width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 3L18 17" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 9.7C3.5 6 6.5 4 10 4C13.5 4 16.5 6 17.5 9.7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="9.7" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Cashier/Point of Sale Icon
export const CashierIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="4.75" width="20" height="14.5" rx="2.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2 9.25H22" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M9.75 10.75V20.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="8" cy="15.5" r="0.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="18.5" r="0.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Open Orders Icon
export const OpenOrdersIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="5.5" width="20" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2 9.5H22" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7.75 7.75H16.25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M7.75 12.25H12.25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M7.75 15.75H14.25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

// Production Icon
export const ProductionIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2V5.25M12 5.25H19.25M12 5.25H4.75" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="7" y="11" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Transaction/Payment Icon
export const TransactionIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="7.25" width="20" height="9.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2 9.5H22" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="6.5" y="13.75" width="2.5" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Inventory/Supplies Icon
export const InventoryIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2.75L20.75 7V18.25C20.75 19.3546 19.8546 20.25 18.75 20.25H5.25C4.14543 20.25 3.25 19.3546 3.25 18.25V7L12 2.75Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.75 10C7.75 9.58579 8.08579 9.25 8.5 9.25H15.5C15.9142 9.25 16.25 9.58579 16.25 10C16.25 10.4142 15.9142 10.75 15.5 10.75H8.5C8.08579 10.75 7.75 10.4142 7.75 10Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8.5 13.5H15.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

// Expense/Money Out Icon
export const ExpenseIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Report/Chart Icon
export const ReportIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="0.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7.5 17.25V10.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M11.25 17.25V7.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M15 17.25V13.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

// Database/Folder Icon for Master Data
export const DatabaseIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2.25" y="3.25" width="19.5" height="7.5" rx="1.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="2.25" y="12.25" width="19.5" height="7.5" rx="1.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// User Icon (different from UserCircle)
export const UserIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7 19C7 16.5 9.5 15 12 15C14.5 15 17 16.5 17 19" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Key/Shield Icon for Roles & Permissions
export const KeyIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="8" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M11 12L22 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M8 15L3 21L6 21L8 18.5L10.5 21L13 21L8 15Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Settings/Gear Icon
export const SettingsIcon: React.FC<IconProps> = ({ className, width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 2V4.5M12 19.5V22M22 12H19.5M4.5 12H2M19.07 4.93L17.65 6.35M6.35 17.65L4.93 19.07M19.07 19.07L17.65 17.65M6.35 6.35L4.93 4.93" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
