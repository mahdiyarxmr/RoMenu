'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  ChevronLeft,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { ordersApi, paymentsApi } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDateTime, toPersianDigits } from '@/utils/formatters';

const STATUS_MAP: Record<
  OrderStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' }
> = {
  COMPLETED: { label: 'تکمیل و تحویل شده', variant: 'success' },
  PAID: { label: 'پرداخت شده', variant: 'primary' },
  PENDING_PAYMENT: { label: 'در انتظار پرداخت', variant: 'warning' },
  PROCESSING_PAYMENT: { label: 'در حال پردازش', variant: 'info' },
  PAYMENT_FAILED: { label: 'پرداخت ناموفق', variant: 'danger' },
  CANCELLED: { label: 'لغو شده', variant: 'neutral' },
  EXPIRED: { label: 'منقضی شده', variant: 'neutral' },
  REFUNDED: { label: 'مرجوع شده', variant: 'info' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = () => {
    ordersApi
      .getAll(1, 30)
      .then((data) => setOrders(data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePayOrder = async (orderId: string) => {
    try {
      const res = await paymentsApi.startOrderPayment(orderId);
      if (res.redirectUrl.startsWith('/')) {
        router.push(res.redirectUrl);
      } else {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در شروع پرداخت');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('آیا از لغو این سفارش اطمینان دارید؟')) return;
    setCancellingId(orderId);
    try {
      await ordersApi.cancel(orderId);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در لغو سفارش');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <MobileFrame>
      <Header />

      <main className="flex-1 p-4 pb-24 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-base font-black text-[#1E293B] dark:text-white">تاریخچه سفارش‌ها</h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
            {toPersianDigits(orders.length)} سفارش
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300 dark:border-slate-700"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="هنوز سفارشی ثبت نکرده‌اید"
            description="سفارش‌های بوفه پس از ثبت در اینجا نمایش داده می‌شوند"
            actionText="مشاهده منوی بوفه"
            onAction={() => router.push('/')}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusCfg = STATUS_MAP[order.status] || { label: order.status, variant: 'neutral' };
              const isPending = order.status === 'PENDING_PAYMENT';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs hover:-translate-y-0.5 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#202A5A] dark:text-white">
                        سفارش #{order.id.slice(0, 8)}
                      </span>
                      <Badge variant={statusCfg.variant} size="sm">
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  {/* Summary of items */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                    {order.items?.map((it) => `${it.productName} (${toPersianDigits(it.quantity)})`).join('، ')}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#242F42]">
                    <span className="text-xs font-bold text-slate-500">مبلغ کل سفارش</span>
                    <span className="text-sm font-black text-[#202A5A] dark:text-[#59BBAF]">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {/* Actions for pending payment */}
                  {isPending && (
                    <div
                      className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#242F42]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handlePayOrder(order.id)}
                        className="flex-1 flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={14} />
                        <span>پرداخت کسری ({formatPrice(order.gatewayAmount)})</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-[#EF4444] border-[#EF4444]"
                      >
                        <span>لغو</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Order Details Modal */}
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`جزئیات سفارش #${selectedOrder?.id.slice(0, 8)}`}
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#242F42]">
                <span className="text-xs text-slate-500">وضعیت سفارش:</span>
                <Badge
                  variant={STATUS_MAP[selectedOrder.status]?.variant || 'neutral'}
                  size="md"
                >
                  {STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  اقلام سفارش:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedOrder.items?.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] text-xs"
                    >
                      <span>
                        {it.productName} × {toPersianDigits(it.quantity)}
                      </span>
                      <span className="font-bold">{formatPrice(it.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#242F42] text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>جمع اقلام:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[#59BBAF]">
                  <span>کسر شده از کیف پول:</span>
                  <span>{formatPrice(selectedOrder.walletDeduction)}</span>
                </div>
                <div className="flex items-center justify-between text-[#202A5A] dark:text-white font-bold pt-1 border-t border-slate-200 dark:border-[#242F42]">
                  <span>پرداخت درگاه:</span>
                  <span>{formatPrice(selectedOrder.gatewayAmount)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full"
                >
                  بستن
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </main>

      <Navbar />
    </MobileFrame>
  );
}
