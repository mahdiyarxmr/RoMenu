export type UserRole = 'customer' | 'admin' | 'finance_admin';

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  wallet?: Wallet;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT' | 'RESERVE' | 'RELEASE' | 'REFUND' | 'ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  trackInventory: boolean;
  stock?: number;
  isSoldOut?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PROCESSING_PAYMENT'
  | 'PAID'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  walletDeduction: number;
  gatewayAmount: number;
  total: number;
  paymentProvider?: string;
  expiresAt?: string;
  paidAt?: string;
  completedAt?: string;
  createdAt: string;
  items: OrderItem[];
  user?: User;
}

export interface Payment {
  id: string;
  orderId?: string;
  topUpId?: string;
  userId: string;
  provider: string;
  mode: 'SANDBOX' | 'LIVE';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  authorityOrToken?: string;
  referenceId?: string;
  verifiedAt?: string;
  createdAt: string;
  user?: User;
}

export interface PaymentSettings {
  id: string;
  mode: 'SANDBOX' | 'LIVE';
  activeProvider: string;
  minTopUpAmount: number;
  maxTopUpAmount: number;
  zarinpalSandbox: boolean;
  credentialsMasked?: Record<string, Record<string, string>>;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  activeTheme: 'neo-brutal' | 'rokad-sticker' | 'minimal-premium' | 'dark-neon' | 'soft-playful';
  timezone: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'INITIAL' | 'RESTOCK' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE' | 'SALE';
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  adminId?: string;
  orderId?: string;
  createdAt: string;
}
