'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  ShoppingBag,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { formatPrice, toPersianDigits, formatDateTime } from '@/utils/formatters';

const PRESETS = [
  { id: 'today', label: 'امروز' },
  { id: 'yesterday', label: 'دیروز' },
  { id: '7days', label: '۷ روز اخیر' },
  { id: '30days', label: '۳۰ روز اخیر' },
  { id: 'thisMonth', label: 'این ماه' },
  { id: 'lastMonth', label: 'ماه گذشته' },
  { id: 'all', label: 'کل فروش' },
];

export default function AdminReportsPage() {
  const [preset, setPreset] = useState('30days');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    adminApi
      .getSalesReport(preset)
      .then((data) => setReport(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const summary = report?.summary || {
    totalSales: 0,
    successfulOrders: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
  };

  const days = report?.days || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white">گزارش جامع فروش بوفه</h1>
          <p className="text-xs text-slate-500 mt-1">
            تحلیل روزبه‌روز درآمد، تعداد اقلام، سهم هر خوراکی و سفارش‌های تسویه‌شده
          </p>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                preset === p.id
                  ? 'bg-[#202A5A] text-white border-[#0B0F1F] dark:bg-[#59BBAF] dark:text-[#1F413D]'
                  : 'bg-white dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#242F42] hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">جمع کل درآمد</span>
            <TrendingUp size={16} className="text-[#009966]" />
          </div>
          <div className="text-base font-black text-[#009966] dark:text-emerald-400">
            {formatPrice(summary.totalSales)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">سفارش‌های موفق</span>
            <ShoppingBag size={16} className="text-[#59BBAF]" />
          </div>
          <div className="text-base font-black text-[#1E293B] dark:text-white">
            {toPersianDigits(summary.successfulOrders)} سفارش
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">تعداد کل اقلام</span>
            <Package size={16} className="text-[#F8A41D]" />
          </div>
          <div className="text-base font-black text-[#1E293B] dark:text-white">
            {toPersianDigits(summary.totalItemsSold)} عدد
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">میانگین هر سفارش</span>
            <Layers size={16} className="text-[#8A38F5]" />
          </div>
          <div className="text-base font-black text-[#1E293B] dark:text-white">
            {formatPrice(summary.averageOrderValue)}
          </div>
        </div>
      </div>

      {/* Day-by-Day Breakdown Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
        <h2 className="text-sm font-black text-[#1E293B] dark:text-white">جدول تفکیک روز‌به‌روز فروش</h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">در حال محاسبه گزارش فروش...</div>
        ) : days.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            در این بازه زمانی فروشی ثبت نشده است
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day: any) => {
              const isOpen = expandedDays[day.date];
              return (
                <div
                  key={day.date}
                  className="rounded-2xl border border-slate-200 dark:border-[#242F42] bg-slate-50/50 dark:bg-[#0B0F17] overflow-hidden"
                >
                  {/* Day Header */}
                  <div
                    onClick={() => toggleDay(day.date)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#202A5A] dark:text-white">
                        <Calendar size={15} />
                        <span>{day.date}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        ({toPersianDigits(day.ordersCount)} سفارش)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#009966] dark:text-emerald-400">
                        {formatPrice(day.dailyTotal)}
                      </span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Day Details Drawer */}
                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-[#151C28] border-t border-slate-200 dark:border-[#242F42] space-y-4 text-xs">
                      {/* Products breakdown */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-2">
                          سهم اقلام فروخته شده در این روز:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {day.topProducts.map((p: any, i: number) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#242F42] flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold block">{p.name}</span>
                                <span className="text-[10px] text-slate-400">
                                  {toPersianDigits(p.quantity)} عدد
                                </span>
                              </div>
                              <div className="text-left">
                                <span className="font-bold text-[#009966] block">
                                  {formatPrice(p.revenue)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {toPersianDigits(p.sharePercent)}٪ از روز
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Orders in this day */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-2">
                          سفارش‌های ثبت شده:
                        </span>
                        <div className="space-y-1.5">
                          {day.orders.map((o: any) => (
                            <div
                              key={o.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] text-[11px]"
                            >
                              <span>
                                #{o.id.slice(0, 8)} — خریدار: {o.user?.name || 'مشتری'}
                              </span>
                              <span className="font-bold">{formatPrice(o.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
