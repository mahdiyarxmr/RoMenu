'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ArrowUpRight, Wifi, Zap, Sparkles, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, toPersianDigits } from '@/utils/formatters';

export const WalletCard: React.FC = () => {
  const { user } = useAuth();
  const balance = user?.wallet?.balance ?? 0;

  if (!user) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#202A5A] text-white p-5 border-[2px] border-[#202A5A] shadow-hard-md">
        {/* Background Emblem */}
        <img
          src="/logos/Sign-01.svg"
          alt=""
          className="absolute -left-6 -bottom-8 w-40 h-40 opacity-10 pointer-events-none invert"
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#59BBAF] animate-pulse" />
              <span className="text-xs font-black tracking-wide text-slate-200">
                کارت بوفه دیجیتال رُکاد
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[#59BBAF]/20 text-[#59BBAF] border border-[#59BBAF]/30 px-2 py-0.5 rounded-full">
              تحویل ۱-کلیکی ⚡
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-white">سفارش سریع خوراکی بدون صف</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              با ورود به حساب یا شارژ کیف پول، در زنگ‌های تفریح بدون ایستادن در صف بوفه خرید کنید.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#59BBAF] text-[#0F172A] font-black text-xs rounded-xl border-[1.5px] border-[#388E84] shadow-hard-xs active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <span>ورود به حساب</span>
              <ChevronLeft size={16} />
            </Link>
            <Link
              href="/register"
              className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              ثبت‌نام
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Last 4 digits of mobile for card simulation
  const lastDigits = user.mobile ? user.mobile.slice(-4) : '۰۰۰۰';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#202A5A] to-[#0F172A] text-white p-5 border-[2px] border-[#202A5A] dark:border-[#59BBAF] shadow-hard-md select-none transition-all">
      {/* Background Micro Dot-Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Watermarked Rokad Sign */}
      <img
        src="/logos/Sign-01.svg"
        alt=""
        className="absolute -left-6 -bottom-6 w-44 h-44 opacity-15 pointer-events-none invert"
      />

      <div className="relative z-10 space-y-4">
        {/* Top Row: Card Branding, Contactless & Pass Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Metallic Gold EMV Chip */}
            <div className="w-10 h-7 rounded-lg bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border border-amber-600/60 shadow-inner flex flex-col justify-around p-1 relative overflow-hidden">
              <div className="w-full h-[1px] bg-amber-700/40" />
              <div className="flex justify-between w-full">
                <div className="w-2.5 h-[1px] bg-amber-700/40" />
                <div className="w-2.5 h-[1px] bg-amber-700/40" />
              </div>
              <div className="w-full h-[1px] bg-amber-700/40" />
            </div>

            <Wifi size={18} className="rotate-90 text-slate-300 opacity-80" />

            <div className="leading-tight">
              <div className="text-[11px] font-black tracking-wider text-slate-200">
                رُکاد کارت بوفه
              </div>
              <div className="text-[9px] font-mono text-slate-400">ROKAD PASS</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[10px] font-bold text-[#59BBAF]">اعتبار فعال</span>
          </div>
        </div>

        {/* Center Row: Balance with Large Impact Numeral */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
            <span>موجودی کیف پول</span>
            <span className="text-[11px] text-[#59BBAF] font-bold flex items-center gap-1">
              <Zap size={12} />
              <span>تسویه ۱-کلیکی بدون معطلی</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight drop-shadow-sm font-sans">
              {toPersianDigits(balance.toLocaleString())}
            </span>
            <span className="text-xs font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-lg">
              تومان
            </span>
          </div>
        </div>

        {/* Bottom Row: Card Details & CTAs */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">دارنده کارت</div>
            <div className="text-xs font-black text-white">{user.name}</div>
            <div className="text-[10px] font-mono text-slate-400 tracking-widest mt-0.5">
              ۵۰۲۲ •••• •••• {toPersianDigits(lastDigits)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl border border-white/20 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              تراکنش‌ها
            </Link>

            <Link
              href="/account/topup"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#59BBAF] hover:bg-[#50A89E] text-[#0F172A] font-black text-xs rounded-xl border-[1.5px] border-[#2A6D65] shadow-hard-xs active:translate-x-[1.5px] active:translate-y-[1.5px] transition-all"
            >
              <Plus size={15} strokeWidth={3} />
              <span>شارژ آنی</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
