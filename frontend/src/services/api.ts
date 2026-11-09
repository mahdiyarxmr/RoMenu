import axios from 'axios';
import {
  User,
  Product,
  Order,
  Payment,
  PaymentSettings,
  StoreSettings,
  Wallet,
  WalletTransaction,
  AuditLog,
  InventoryMovement,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('romenu_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('romenu_token');
      localStorage.removeItem('romenu_user');
      // If not already on login or register, redirect
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { mobile: string; password: string }) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    return data;
  },
  register: async (payload: { name: string; mobile: string; password: string }) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/register', payload);
    return data;
  },
  getMe: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};

export const productsApi = {
  getAll: async () => {
    const { data } = await api.get<Product[]>('/products');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },
};

export const ordersApi = {
  create: async (payload: { items: { productId: string; quantity: number }[]; idempotencyKey?: string }) => {
    const { data } = await api.post<{ order: Order; paymentNeeded: boolean; paymentUrl?: string }>('/orders', payload);
    return data;
  },
  getAll: async (page = 1, limit = 30) => {
    const { data } = await api.get<{ orders: Order[]; total: number }>('/orders', { params: { page, limit } });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await api.post<Order>(`/orders/${id}/cancel`);
    return data;
  },
};

export const paymentsApi = {
  startOrderPayment: async (orderId: string) => {
    const { data } = await api.post<{ redirectUrl: string; paymentId: string; provider: string }>(
      '/payments/orders/start',
      { orderId }
    );
    return data;
  },
  sandboxAction: async (payload: { paymentId: string; action: 'success' | 'failed' | 'cancel' }) => {
    const { data } = await api.post<{ redirectUrl: string }>('/payments/sandbox/action', payload);
    return data;
  },
  getMinePayment: async (paymentId: string) => {
    const { data } = await api.get<{
      payment: Payment;
      order?: Order;
    }>(`/payments/mine/${paymentId}`);
    return data;
  },
};

export const walletApi = {
  getWallet: async () => {
    const { data } = await api.get<Wallet>('/wallet');
    return data;
  },
  getTransactions: async (page = 1, limit = 20) => {
    const { data } = await api.get<{ transactions: WalletTransaction[]; total: number }>('/wallet/transactions', {
      params: { page, limit },
    });
    return data;
  },
  startTopUp: async (amount: number) => {
    const { data } = await api.post<{ topUpId: string; redirectUrl: string; paymentId: string }>('/wallet/top-ups', {
      amount,
    });
    return data;
  },
  getTopUpStatus: async (topUpId: string) => {
    const { data } = await api.get<{ status: string; amount: number; balance: number }>(`/wallet/top-ups/${topUpId}/status`);
    return data;
  },
};

export const storeApi = {
  getStoreSettings: async () => {
    const { data } = await api.get<StoreSettings>('/store');
    return data;
  },
  getStoreTheme: async () => {
    const { data } = await api.get<{ theme: string }>('/store/theme');
    return data;
  },
};

export const adminApi = {
  getDashboard: async () => {
    const { data } = await api.get<{
      kpis: {
        todaySales: number;
        todayOrdersCount: number;
        totalUsers: number;
        totalWalletBalance: number;
        activeProductsCount: number;
        soldOutProductsCount: number;
      };
      recentOrders: Order[];
      recentFailedPayments: Payment[];
    }>('/admin/dashboard');
    return data;
  },
  getUsers: async (search?: string) => {
    const { data } = await api.get<User[]>('/admin/users', { params: { search } });
    return data;
  },
  adjustUserWallet: async (userId: string, payload: { amount: number; type: 'CREDIT' | 'DEBIT'; reason: string }) => {
    const { data } = await api.post<{ wallet: Wallet; transaction: WalletTransaction }>(
      `/admin/users/${userId}/wallet-adjustment`,
      payload
    );
    return data;
  },
  toggleUserActive: async (userId: string, isActive: boolean) => {
    const { data } = await api.patch<User>(`/admin/users/${userId}/active`, { isActive });
    return data;
  },
  getProducts: async () => {
    const { data } = await api.get<Product[]>('/admin/products');
    return data;
  },
  createProduct: async (productData: Partial<Product>) => {
    const { data } = await api.post<Product>('/admin/products', productData);
    return data;
  },
  updateProduct: async (id: string, productData: Partial<Product>) => {
    const { data } = await api.patch<Product>(`/admin/products/${id}`, productData);
    return data;
  },
  deleteProduct: async (id: string) => {
    const { data } = await api.delete(`/admin/products/${id}`);
    return data;
  },
  restockProduct: async (id: string, payload: { quantityChange: number; reason: string; setExact?: boolean }) => {
    const { data } = await api.post<Product>(`/admin/products/${id}/restock`, payload);
    return data;
  },
  getProductMovements: async (id: string) => {
    const { data } = await api.get<InventoryMovement[]>(`/admin/products/${id}/movements`);
    return data;
  },
  getOrders: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<{ orders: Order[]; total: number }>('/admin/orders', { params });
    return data;
  },
  getPayments: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<{ payments: Payment[]; total: number }>('/admin/payments', { params });
    return data;
  },
  getSalesReport: async (preset: string, startDate?: string, endDate?: string) => {
    const { data } = await api.get<{
      summary: {
        totalSales: number;
        successfulOrders: number;
        totalItemsSold: number;
        averageOrderValue: number;
      };
      days: {
        date: string;
        dailyTotal: number;
        ordersCount: number;
        topProducts: { name: string; quantity: number; revenue: number; sharePercent: number }[];
        orders: Order[];
      }[];
    }>('/admin/reports/sales', { params: { preset, startDate, endDate } });
    return data;
  },
  getPaymentSettings: async () => {
    const { data } = await api.get<PaymentSettings>('/admin/settings/payment');
    return data;
  },
  updatePaymentSettings: async (settings: Partial<PaymentSettings>) => {
    const { data } = await api.patch<PaymentSettings>('/admin/settings/payment', settings);
    return data;
  },
  saveProviderCredentials: async (provider: string, credentials: Record<string, string>) => {
    const { data } = await api.post(`/admin/settings/payment/credentials/${provider}`, credentials);
    return data;
  },
  testZarinpalConnection: async () => {
    const { data } = await api.post<{ success: boolean; authority?: string; message?: string }>(
      '/admin/settings/payment/test-zarinpal'
    );
    return data;
  },
  updateStoreSettings: async (settings: Partial<StoreSettings>) => {
    const { data } = await api.patch<StoreSettings>('/admin/settings/store', settings);
    return data;
  },
  getAuditLogs: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<{ logs: AuditLog[]; total: number }>('/admin/audit-logs', { params });
    return data;
  },
  uploadProductImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>('/uploads/product-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export default api;
