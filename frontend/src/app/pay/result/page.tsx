'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowLeft, Store, ReceiptText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MobileFrame } from '@/components/MobileFrame';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

function PayResultContent() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const status = searchParams.get('status') || 'failed';
  const message = searchParams.get('message') || '';
  const referenceId = searchParams.get('referenceId') || '';
  const orderId = searchParams.get('orderId') || '';

  const isSuccess = status === 'success';

  useEffect(() => {
    refreshUser();
    if (isSuccess) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [isSuccess]);

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col justify-center p-6 space-y-6">
        {/* Outcome Card */}
        <div className="text-center space-y-3">
          <div
            className={`inline-flex p-4 rounded-3xl border-[2px] shadow-hard-md ${
              isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-500'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-500'
            }`}
          >
            {isSuccess ? <CheckCircle2 size={48} strokeWidth={2.5} /> : <XCircle size={48} strokeWidth={2.5} />}
          </div>

          <h1 className="text-xl font-black text-[#1E293B] dark:text-white">
            {isSuccess ? 'پرداخت با موفقیت انجام شد' : 'پرداخت ناموفق بود'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {message || (isSuccess ? 'سفارش شما در بوفه رُکاد ثبت و آماده‌سازی می‌شود' : 'مبلغی از حساب شما کسر نشده است')}
          </p>
        </div>

        {/* Receipt Details Box */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-2 text-xs">
          {referenceId && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#242F42]">
              <span className="text-slate-500">کد پیگیری تراکنش:</span>
              <span className="font-mono font-bold text-[#1E293B] dark:text-white">{referenceId}</span>
            </div>
          )}
          {orderId && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#242F42]">
              <span className="text-slate-500">شماره سفارش:</span>
              <span className="font-mono font-bold text-[#1E293B] dark:text-white">#{orderId.slice(0, 8)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500">زمان ثبت:</span>
            <span className="font-bold text-[#1E293B] dark:text-white">هم‌اکنون</span>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="space-y-2 pt-2">
          <Link href="/">
            <Button size="lg" variant="primary" className="w-full flex items-center justify-center gap-2">
              <Store size={18} />
              <span>بازگشت به منوی بوفه</span>
            </Button>
          </Link>

          <Link href="/orders">
            <Button size="md" variant="outline" className="w-full flex items-center justify-center gap-2">
              <ReceiptText size={16} />
              <span>مشاهده سفارش‌ها</span>
            </Button>
          </Link>
        </div>
      </div>
    </MobileFrame>
  );
}

export default function PayResultPage() {
  return (
    <Suspense
      fallback={
        <MobileFrame>
          <div className="flex-1 flex items-center justify-center text-sm font-bold text-slate-500">
            در حال بارگذاری نتیجه...
          </div>
        </MobileFrame>
      }
    >
      <PayResultContent />
    </Suspense>
  );
}
