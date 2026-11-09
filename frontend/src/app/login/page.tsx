'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Lock, LogIn, ArrowRight, Shield, User } from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { RokadLogo } from '@/components/RokadLogo';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(mobile, password);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'شماره موبایل یا رمز عبور اشتباه است');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (m: string, p: string) => {
    setMobile(m);
    setPassword(p);
  };

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col justify-center p-6 space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <RokadLogo size="lg" />
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white pt-2">ورود به بوفه رُکاد</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            سفارش سریع خوراکی و نوشیدنی بدون معطلی در صف بوفه
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-md space-y-4"
        >
          {error && (
            <div className="p-3 bg-[#FEF2F2] border-[1.5px] border-[#EF4444] rounded-xl text-xs font-bold text-[#B91C1C]">
              {error}
            </div>
          )}

          <Input
            label="شماره موبایل"
            type="tel"
            dir="ltr"
            placeholder="09120000000"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            leadingIcon={<Phone size={18} />}
            required
          />

          <Input
            label="رمز عبور"
            type="password"
            dir="ltr"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leadingIcon={<Lock size={18} />}
            required
          />

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isLoading}
            className="w-full flex items-center justify-center gap-2 shadow-hard-md"
          >
            <LogIn size={18} />
            <span>ورود به حساب</span>
          </Button>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-[#242F42]">
            <span>حساب کاربری ندارید؟ </span>
            <Link href="/register" className="font-bold text-[#59BBAF] hover:underline">
              ثبت‌نام در بوفه
            </Link>
          </div>
        </form>

        {/* Quick Demo Accounts */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#242F42] space-y-2">
          <span className="text-[11px] font-bold text-slate-500 block">
            ورود سریع با حساب‌های آزمایشی (Demo):
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('09120000000', 'admin123')}
              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151C28] border border-slate-200 dark:border-[#242F42] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-[#EEF8F7] transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-[#202A5A] dark:text-[#59BBAF]" />
                <span>مدیر سیستم (ادمین بوفه)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">09120000000</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('09120000001', 'demo1234')}
              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151C28] border border-slate-200 dark:border-[#242F42] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-[#EEF8F7] transition-all"
            >
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-[#59BBAF]" />
                <span>دانش‌آموز دمو (کیف پول ۵۰٬۰۰۰)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">09120000001</span>
            </button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
