'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDateTime, toPersianDigits } from '@/utils/formatters';

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'همه وضعیت‌ها' },
  { id: 'COMPLETED', label: 'تکمیل شده' },
  { id: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
  { id: 'PAID', label: 'پرداخت شده' },
  { id: 'PROCESSING_PAYMENT', label: 'در حال پردازش' },
  { id: 'PAYMENT_FAILED', label: 'ناموفق' },
  { id: 'CANCELLED', label: 'لغو شده' },
  { id: 'EXPIRED', label: 'منقضی شده' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = () => {
    adminApi
      .getOrders({
        status: selectedStatus === 'ALL' ? undefined : (selectedStatus as OrderStatus),
        search: search.trim() || undefined,
        limit: 50,
      })
      .then((data) => {
        setOrders(data.orders);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white">مدیریت سفارش‌های بوفه</h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده، پیگیری و جزئیات تمام سفارش‌های ثبت‌شده دانش‌آموزان
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="جست‌وجوی نام، شماره یا کد سفارش..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:outline-none focus:border-[#59BBAF]"
          />
        </div>
      </div>

      {/* Status Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedStatus(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedStatus === f.id
                ? 'bg-[#202A5A] text-white border-[#0B0F1F] dark:bg-[#59BBAF] dark:text-[#1F413D]'
                : 'bg-white dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#242F42] hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#242F42] text-slate-400 font-bold pb-2.5">
                <th className="pb-2.5">شماره سفارش</th>
                <th className="pb-2.5">مشتری</th>
                <th className="pb-2.5">تعداد اقلام</th>
                <th className="pb-2.5">مبلغ کل</th>
                <th className="pb-2.5">سهم کیف پول</th>
                <th className="pb-2.5">سهم درگاه</th>
                <th className="pb-2.5">وضعیت</th>
                <th className="pb-2.5">تاریخ ثبت</th>
                <th className="pb-2.5 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242F42]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    در حال دریافت سفارش‌ها...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    سفارشی با این فیلترها یافت نشد
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-[#1E293B] dark:text-white">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="py-3">
                      <div className="font-bold">{o.user?.name || 'مشتری'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {toPersianDigits(o.user?.mobile || '')}
                      </div>
                    </td>
                    <td className="py-3 font-bold">{toPersianDigits(o.items?.length || 0)} قلم</td>
                    <td className="py-3 font-black text-[#202A5A] dark:text-[#59BBAF]">
                      {formatPrice(o.total)}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {formatPrice(o.walletDeduction)}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {formatPrice(o.gatewayAmount)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          o.status === 'COMPLETED'
                            ? 'success'
                            : o.status === 'PENDING_PAYMENT'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {o.status === 'COMPLETED'
                          ? 'تکمیل شده'
                          : o.status === 'PENDING_PAYMENT'
                          ? 'در انتظار پرداخت'
                          : o.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-[11px] text-slate-400">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="py-3 text-left">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#59BBAF] transition-colors"
                        title="مشاهده فاکتور و اقلام"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`فاکتور سفارش #${selectedOrder?.id.slice(0, 8)}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-[#0B0F17] rounded-xl text-xs border border-slate-200 dark:border-[#242F42]">
              <div>
                <span className="text-slate-400 block">خریدار:</span>
                <span className="font-bold">{selectedOrder.user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">شماره تماس:</span>
                <span className="font-mono">{toPersianDigits(selectedOrder.user?.mobile || '')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">درگاه پرداخت:</span>
                <span>{selectedOrder.paymentProvider || 'کیف پول داخلی'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">وضعیت:</span>
                <span className="font-bold">{selectedOrder.status}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                اقلام خریداری شده:
              </span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {selectedOrder.items?.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#151C28] text-xs border border-slate-200 dark:border-[#242F42]"
                  >
                    <span>
                      {it.productName} ({formatPrice(it.unitPrice)}) × {toPersianDigits(it.quantity)}
                    </span>
                    <span className="font-bold text-[#009966]">{formatPrice(it.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#0B0F17] rounded-xl text-xs space-y-1 border border-slate-200 dark:border-[#242F42]">
              <div className="flex justify-between">
                <span>جمع اقلام:</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#59BBAF]">
                <span>کسر از کیف پول:</span>
                <span>{formatPrice(selectedOrder.walletDeduction)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-[#242F42]">
                <span>پرداخت بانکی:</span>
                <span>{formatPrice(selectedOrder.gatewayAmount)}</span>
              </div>
            </div>

            <Button size="md" variant="outline" onClick={() => setSelectedOrder(null)} className="w-full">
              بستن
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
