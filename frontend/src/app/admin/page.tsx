'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Wallet,
  Package,
  AlertOctagon,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { Badge } from '@/components/Badge';
import { formatPrice, formatDateTime, toPersianDigits } from '@/utils/formatters';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getDashboard()
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    todaySales: 0,
    todayOrdersCount: 0,
    totalUsers: 0,
    totalWalletBalance: 0,
    activeProductsCount: 0,
    soldOutProductsCount: 0,
  };

  const kpiCards = [
    { title: 'فروش امروز', value: formatPrice(kpis.todaySales), icon: TrendingUp, color: '#009966', bg: '#ECFDF5' },
    { title: 'سفارش‌های امروز', value: `${toPersianDigits(kpis.todayOrdersCount)} سفارش`, icon: ShoppingBag, color: '#59BBAF', bg: '#EEF8F7' },
    { title: 'تعداد کاربران', value: `${toPersianDigits(kpis.totalUsers)} نفر`, icon: Users, color: '#202A5A', bg: '#E9EAEF' },
    { title: 'موجودی کیف پول‌ها', value: formatPrice(kpis.totalWalletBalance), icon: Wallet, color: '#8A38F5', bg: '#F4EBFD' },
    { title: 'محصولات فعال', value: `${toPersianDigits(kpis.activeProductsCount)} محصول`, icon: Package, color: '#F8A41D', bg: '#FEF6E8' },
    { title: 'اقلام ناموجود', value: `${toPersianDigits(kpis.soldOutProductsCount)} قلم`, icon: AlertOctagon, color: '#EF4444', bg: '#FEF2F2' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-[#1E293B] dark:text-white">داشبورد مدیریتی بوفه</h1>
        <p className="text-xs text-slate-500 mt-1">نمای کلی از وضعیت فروش، انبار و کاربران بوفه رُکاد</p>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpiCards.map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-2 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{kpi.title}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: kpi.bg, color: kpi.color }}
              >
                <kpi.icon size={15} />
              </div>
            </div>
            <div className="text-sm font-black text-[#1E293B] dark:text-white tracking-tight">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* 8 Recent Orders */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1E293B] dark:text-white">سفارش‌های اخیر بوفه</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-[#59BBAF] hover:underline">
            مشاهده همه سفارش‌ها
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#242F42] text-slate-400 font-bold pb-2">
                <th className="pb-2.5">شماره سفارش</th>
                <th className="pb-2.5">خریدار</th>
                <th className="pb-2.5">مبلغ کل</th>
                <th className="pb-2.5">سهم کیف پول</th>
                <th className="pb-2.5">درگاه بانکی</th>
                <th className="pb-2.5">وضعیت</th>
                <th className="pb-2.5">زمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242F42]">
              {data?.recentOrders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-mono font-bold text-[#1E293B] dark:text-white">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="py-3 font-bold">
                    {order.user?.name || 'مشتری'}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {toPersianDigits(order.user?.mobile || '')}
                    </span>
                  </td>
                  <td className="py-3 font-black text-[#202A5A] dark:text-[#59BBAF]">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    {formatPrice(order.walletDeduction)}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    {formatPrice(order.gatewayAmount)}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        order.status === 'COMPLETED'
                          ? 'success'
                          : order.status === 'PENDING_PAYMENT'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {order.status === 'COMPLETED'
                        ? 'تکمیل شده'
                        : order.status === 'PENDING_PAYMENT'
                        ? 'در انتظار پرداخت'
                        : order.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-[11px] text-slate-400">
                    {formatDateTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Failed Payments */}
      {data?.recentFailedPayments?.length > 0 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-[#EF4444]/40 shadow-hard-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-[#EF4444]">
            <XCircle size={16} />
            <span>تراکنش‌های ناموفق اخیر</span>
          </div>
          <div className="space-y-2">
            {data.recentFailedPayments.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 text-xs border border-red-200 dark:border-red-900"
              >
                <div>
                  <span className="font-bold">{p.user?.name || 'کاربر'}: </span>
                  <span>{formatPrice(p.amount)}</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">({p.provider})</span>
                </div>
                <span className="text-[10px] text-slate-400">{formatDateTime(p.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
