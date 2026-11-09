'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Wallet as WalletIcon, CreditCard, Check } from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/context/AuthContext';
import { walletApi } from '@/services/api';
import { formatPrice, toPersianDigits } from '@/utils/formatters';

const PRESETS = [50000, 100000, 200000, 500000];

export default function TopUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(100000);
  const [customInput, setCustomInput] = useState<string>('100000');
  const [isLoading, setIsLoading] = useState(false);

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomInput(String(val));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCustomInput(raw);
    setAmount(Number(raw) || 0);
  };

  const handleStartTopUp = async () => {
    if (amount < 10000) {
      alert('حداقل مبلغ شارژ ۱۰٬۰۰۰ تومان است');
      return;
    }
    if (amount > 50000000) {
      alert('حداکثر مبلغ شارژ ۵۰٬۰۰۰٬۰۰۰ تومان است');
      return;
    }

    setIsLoading(true);
    try {
      const res = await walletApi.startTopUp(amount);
      if (res.redirectUrl.startsWith('/')) {
        router.push(res.redirectUrl);
      } else {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در شروع شارژ');
      setIsLoading(false);
    }
  };

  return (
    <MobileFrame>
      <Header />

      <main className="flex-1 p-4 pb-24 space-y-4">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#59BBAF] transition-colors"
          >
            <ArrowRight size={16} />
            <span>بازگشت به حساب</span>
          </Link>
          <span className="text-xs font-black text-[#1E293B] dark:text-white">شارژ آنلاین کیف پول</span>
        </div>

        {/* Current Balance Notice */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#EEF8F7] dark:bg-[#151C28] border-[1.5px] border-[#59BBAF] text-xs">
          <div className="flex items-center gap-2 text-[#1F413D] dark:text-[#59BBAF] font-bold">
            <WalletIcon size={16} />
            <span>موجودی فعلی شما:</span>
          </div>
          <span className="font-black text-sm text-[#1F413D] dark:text-white">
            {formatPrice(user?.wallet?.balance ?? 0)}
          </span>
        </div>

        {/* Presets */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-3">
          <label className="block text-xs font-bold text-[#1E293B] dark:text-white">
            انتخاب مبالغ پیشنهادی:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = amount === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  className={`p-3 rounded-xl border-[1.5px] text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#202A5A] text-white border-[#0B0F1F] shadow-hard-xs dark:bg-[#59BBAF] dark:text-[#1F413D]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-[#242F42] hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                  <span>{formatPrice(preset)}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Input */}
          <div className="pt-2">
            <Input
              label="یا مبلغ دلخواه (تومان):"
              type="text"
              value={customInput}
              onChange={handleCustomChange}
              placeholder="مثلاً ۱۰۰۰۰۰"
              helperText={`مبلغ به حروف و فرمت: ${formatPrice(amount)}`}
            />
          </div>
        </div>

        {/* Payment CTA */}
        <Button
          size="lg"
          variant="primary"
          isLoading={isLoading}
          onClick={handleStartTopUp}
          className="w-full flex items-center justify-center gap-2 shadow-hard-md"
        >
          <CreditCard size={18} />
          <span>انتقال به درگاه بانکی جهت شارژ</span>
        </Button>
      </main>

      <Navbar />
    </MobileFrame>
  );
}
