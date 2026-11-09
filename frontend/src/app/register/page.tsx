'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, Lock, UserPlus } from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { RokadLogo } from '@/components/RokadLogo';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(name, mobile, password);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت‌نام کاربر جدید');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col justify-center p-6 space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <RokadLogo size="lg" />
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white pt-2">ثبت‌نام در بوفه رُکاد</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ساخت حساب کاربری سریع برای خرید از بوفه مدرسه
          </p>
        </div>

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
            label="نام و نام خانوادگی"
            type="text"
            placeholder="مثلاً: علی رضایی"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leadingIcon={<User size={18} />}
            required
          />

          <Input
            label="شماره موبایل"
            type="tel"
            dir="ltr"
            placeholder="0912xxxxxxx"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            leadingIcon={<Phone size={18} />}
            required
          />

          <Input
            label="رمز عبور (حداقل ۶ کاراکتر)"
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
            <UserPlus size={18} />
            <span>عضویت و ایجاد حساب</span>
          </Button>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-[#242F42]">
            <span>قبلاً ثبت‌نام کرده‌اید؟ </span>
            <Link href="/login" className="font-bold text-[#59BBAF] hover:underline">
              ورود به حساب
            </Link>
          </div>
        </form>
      </div>
    </MobileFrame>
  );
}
