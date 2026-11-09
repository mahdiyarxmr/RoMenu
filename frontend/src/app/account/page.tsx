'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Wallet as WalletIcon,
  Plus,
  Moon,
  Sun,
  Shield,
  LogOut,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ChevronLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { walletApi } from '@/services/api';
import { WalletTransaction } from '@/types';
import { formatPrice, formatDateTime, toPersianDigits } from '@/utils/formatters';

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode, theme, persona, setPersona } = useTheme();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const personaAvatars: Record<string, string> = {
    ecosystem: '/images/profiles/Academy.jpg',
    male: '/images/profiles/Boy.png',
    female: '/images/profiles/Girl.jpg',
    college: '/images/profiles/School.jpg',
    club: '/images/profiles/Game Club.jpg',
  };

  useEffect(() => {
    if (!user) return;
    walletApi
      .getTransactions(1, 10)
      .then((data) => setTransactions(data.transactions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <MobileFrame>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-300 dark:border-[#242F42] flex items-center justify-center text-slate-400">
            <UserIcon size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E293B] dark:text-white">ورود به حساب کاربری</h3>
            <p className="text-xs text-slate-500 mt-1">
              برای مشاهده موجودی و پیگیری سفارش‌ها وارد حساب شوید
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-xs">
            <Link href="/login" className="flex-1">
              <Button size="md" variant="primary" className="w-full">
                ورود
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button size="md" variant="outline" className="w-full">
                ثبت‌نام
              </Button>
            </Link>
          </div>
        </div>
        <Navbar />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <Header />

      <main className="flex-1 p-4 pb-24 space-y-4">
        {/* User Card */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-[1.5px] border-[#59BBAF] bg-[#EEF8F7] dark:bg-[#1C2536] flex items-center justify-center text-[#1F413D] dark:text-[#59BBAF] font-black text-lg shadow-hard-xs">
              <img
                src={personaAvatars[persona] || '/images/profiles/Academy.jpg'}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1E293B] dark:text-white">{user.name}</h2>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {toPersianDigits(user.mobile)}
              </div>
            </div>
          </div>

          <Badge variant={user.role === 'admin' ? 'primary' : 'neutral'} size="sm">
            {user.role === 'admin' ? 'مدیر سامانه' : 'دانش‌آموز / کاربر'}
          </Badge>
        </div>

        {/* Gradient Wallet Balance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#59BBAF] via-[#438C83] to-[#202A5A] text-white p-5 border-[1.5px] border-[#202A5A] shadow-hard-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon size={20} />
              <span className="text-xs font-bold text-slate-100">موجودی کیف پول شما</span>
            </div>
            <Link
              href="/account/topup"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#202A5A] text-xs font-black rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
            >
              <Plus size={14} strokeWidth={3} />
              <span>افزایش موجودی</span>
            </Link>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-black text-white tracking-tight">
              {formatPrice(user.wallet?.balance ?? 0)}
            </div>
            <div className="text-[11px] text-slate-200 mt-1">
              قابل استفاده برای خرید سریع از تمام اقلام بوفه
            </div>
          </div>
        </div>

        {/* Persona Theme Selector */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#1E293B] dark:text-white">
              <SlidersHorizontal size={14} />
              <span>تم‌های هویتی اکوسیستم رُکاد</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{persona}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[
              { id: 'ecosystem', label: 'اکوسیستم', color: '#59BBAF' },
              { id: 'male', label: 'پسرانه', color: '#202A5A' },
              { id: 'female', label: 'دخترانه', color: '#E0195B' },
              { id: 'college', label: 'کالج', color: '#F8A41D' },
              { id: 'club', label: 'باشگاه', color: '#8A38F5' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id as any)}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${
                  persona === p.id
                    ? 'border-[#202A5A] dark:border-white shadow-hard-xs bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="space-y-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#EEF8F7] dark:bg-[#151C28] border-[1.5px] border-[#202A5A] dark:border-[#59BBAF] text-[#1F413D] dark:text-[#59BBAF] shadow-hard-xs font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <Shield size={18} />
                <span>ورود به پنل مدیریت بوفه</span>
              </div>
              <ChevronLeft size={16} />
            </Link>
          )}

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs font-bold text-xs text-[#1E293B] dark:text-white"
          >
            <div className="flex items-center gap-2">
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              <span>حالت نمایش صفحه ({darkMode ? 'تاریک' : 'روشن'})</span>
            </div>
            <span className="text-[11px] text-slate-400">تغییر</span>
          </button>
        </div>

        {/* 10 Recent Wallet Transactions */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-[#1E293B] dark:text-white">گردش حساب کیف پول</h3>
            <span className="text-[11px] text-slate-400">۱۰ تراکنش اخیر</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#151C28] border border-slate-200 dark:border-[#242F42] text-center text-xs text-slate-400">
              هنوز تراکنشی در کیف پول ثبت نشده است
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'CREDIT' || (tx.type === 'ADJUSTMENT' && tx.balanceAfter > tx.balanceBefore);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                          isCredit
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : 'bg-[#FEF2F2] text-[#B91C1C]'
                        }`}
                      >
                        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-[#1E293B] dark:text-white">
                          {tx.description || (isCredit ? 'افزایش موجودی' : 'خرید از بوفه')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateTime(tx.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div
                        className={`font-black ${
                          isCredit ? 'text-[#059669]' : 'text-[#B91C1C]'
                        }`}
                      >
                        {isCredit ? '+' : '−'} {formatPrice(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        مانده: {formatPrice(tx.balanceAfter)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <Button
            size="md"
            variant="outline"
            onClick={logout}
            className="w-full text-[#EF4444] border-[#EF4444] hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>خروج از حساب</span>
          </Button>
        </div>
      </main>

      <Navbar />
    </MobileFrame>
  );
}
