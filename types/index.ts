// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role?: Role;
}

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
}

// Store Types
export interface Store {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: ProductCategory;
  addons?: ProductAddon[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
}

export interface ProductAddon {
  id: number;
  name: string;
  price: number;
  description?: string;
}

// Order Types
export interface Order {
  id: number;
  orderNumber: string;
  store: Store;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
  addons?: OrderItemAddon[];
  subtotal: number;
}

export interface OrderItemAddon {
  id: number;
  addon: ProductAddon;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// Transaction Types
export interface Transaction {
  id: number;
  order: Order;
  paymentMethod: PaymentMethod;
  amount: number;
  change?: number;
  createdAt: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'cash' | 'card' | 'digital';
}

// Employee Types
export interface Employee {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  store?: Store;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attendance {
  id: number;
  employee: Employee;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late';
}

// Supply Types
export interface Supply {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Production Types
export interface Production {
  id: number;
  store: Store;
  date: string;
  product: Product;
  quantity: number;
  weather?: Weather;
  createdAt?: string;
  updatedAt?: string;
}

export interface Weather {
  id: number;
  date: string;
  condition: WeatherCondition;
  temperature?: number;
  description?: string;
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

// Expense Types
export interface Expense {
  id: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
}

// Report Types
export interface DailyReport {
  date: string;
  store: Store;
  production: Production[];
  transactions: Transaction[];
  expenses: Expense[];
  weather: Weather;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  recommendations?: string[];
}

export interface MonthlyReport {
  month: string;
  year: number;
  store: Store;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averageDailyRevenue: number;
  averageDailyExpenses: number;
  daysWithData: number;
}

export interface YearlyReport {
  year: number;
  store: Store;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averageMonthlyRevenue: number;
  averageMonthlyExpenses: number;
  monthsWithData: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

