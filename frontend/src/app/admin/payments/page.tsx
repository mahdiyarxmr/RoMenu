'use client';

import React, { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Badge } from '@/components/Badge';
import { Payment } from '@/types';
import { formatPrice, formatDateTime, toPersianDigits } from '@/utils/formatters';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = () => {
    adminApi
      .getPayments({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        limit: 50,
      })
      .then((data) => setPayments(data.payments))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white">تراکنش‌ها و پرداخت‌های بانکی</h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده، پیگیری و اعتبارسنجی کلیه تراکنش‌های درگاه‌های بانکی و شارژها
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="جست‌وجوی کد پیگیری، توکن، نام..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:outline-none focus:border-[#59BBAF]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {[
          { id: '', label: 'همه تراکنش‌ها' },
          { id: 'SUCCESS', label: 'موفق' },
          { id: 'PENDING', label: 'در انتظار پرداخت' },
          { id: 'FAILED', label: 'ناموفق' },
          { id: 'CANCELLED', label: 'لغو شده' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === f.id
                ? 'bg-[#202A5A] text-white border-[#0B0F1F] dark:bg-[#59BBAF] dark:text-[#1F413D]'
                : 'bg-white dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#242F42] hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#242F42] text-slate-400 font-bold pb-2.5">
                <th className="pb-2.5">کد پیگیری / رفرنس</th>
                <th className="pb-2.5">کاربر</th>
                <th className="pb-2.5">مبلغ تراکنش</th>
                <th className="pb-2.5">درگاه</th>
                <th className="pb-2.5">حالت</th>
                <th className="pb-2.5">هدف</th>
                <th className="pb-2.5">وضعیت</th>
                <th className="pb-2.5">زمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242F42]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    در حال دریافت پرداخت‌ها...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    تراکنشی با این مشخصات یافت نشد
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-[#1E293B] dark:text-white">
                      {p.referenceId || p.authorityOrToken || p.id.slice(0, 10)}
                    </td>
                    <td className="py-3 font-bold">{p.user?.name || 'کاربر'}</td>
                    <td className="py-3 font-black text-[#202A5A] dark:text-[#59BBAF]">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="py-3 font-medium uppercase text-slate-600 dark:text-slate-300">
                      {p.provider}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          p.mode === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.mode}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {p.orderId ? `سفارش #${p.orderId.slice(0, 6)}` : 'شارژ کیف پول'}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          p.status === 'SUCCESS' ? 'success' : p.status === 'PENDING' ? 'warning' : 'danger'
                        }
                        size="sm"
                      >
                        {p.status === 'SUCCESS'
                          ? 'موفق'
                          : p.status === 'PENDING'
                          ? 'در انتظار'
                          : p.status === 'FAILED'
                          ? 'ناموفق'
                          : 'لغو شده'}
                      </Badge>
                    </td>
                    <td className="py-3 text-[11px] text-slate-400">
                      {formatDateTime(p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
