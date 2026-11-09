'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle2, XCircle, RotateCcw, CreditCard, FlaskConical } from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Button } from '@/components/Button';
import { paymentsApi } from '@/services/api';
import { formatPrice } from '@/utils/formatters';

function SandboxPayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId') || '';
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    paymentsApi
      .getMinePayment(paymentId)
      .then((data) => setDetails(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paymentId]);

  const handleAction = async (action: 'success' | 'failed' | 'cancel') => {
    setActionLoading(action);
    try {
      const res = await paymentsApi.sandboxAction({ paymentId, action });
      router.push(res.redirectUrl);
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در شبیه‌ساز پرداخت');
      setActionLoading(null);
    }
  };

  const amount = details?.payment?.amount || 0;

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col justify-center p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-[1.5px] border-amber-400 text-amber-600 dark:text-amber-400 shadow-hard-xs mb-2">
            <FlaskConical size={32} />
          </div>
          <h1 className="text-lg font-black text-[#1E293B] dark:text-white">
            شبیه‌ساز پرداخت شاپرک (سندباکس رُکاد)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            محیط شبیه‌سازی تست تراکنش‌های مالی بوفه بدون نیاز به کارت بانکی واقعی
          </p>
        </div>

        {/* Invoice Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#242F42]">
            <span className="text-xs text-slate-500 font-bold">مبلغ قابل پرداخت:</span>
            <span className="text-lg font-black text-[#202A5A] dark:text-[#59BBAF]">
              {formatPrice(amount)}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>شناسه پرداخت:</span>
              <span className="font-mono">{paymentId.slice(0, 12)}...</span>
            </div>
            {details?.order && (
              <div className="flex justify-between">
                <span>شماره سفارش:</span>
                <span className="font-mono">#{details.order.id.slice(0, 8)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>درگاه شبیه‌سازی شده:</span>
              <span className="font-bold">سندباکس امن رُکاد</span>
            </div>
          </div>
        </div>

        {/* Three Action Buttons */}
        <div className="space-y-2.5">
          <Button
            size="lg"
            variant="primary"
            isLoading={actionLoading === 'success'}
            onClick={() => handleAction('success')}
            className="w-full flex items-center justify-center gap-2 shadow-hard-md bg-[#10B981] hover:bg-[#059669] text-white border-[#059669]"
          >
            <CheckCircle2 size={18} />
            <span>پرداخت موفق (شبیه‌سازی تایید بانک)</span>
          </Button>

          <Button
            size="md"
            variant="outline"
            isLoading={actionLoading === 'failed'}
            onClick={() => handleAction('failed')}
            className="w-full flex items-center justify-center gap-2 text-[#EF4444] border-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <XCircle size={18} />
            <span>شبیه‌سازی خطای بانکی / کسری موجودی کارت</span>
          </Button>

          <Button
            size="md"
            variant="ghost"
            isLoading={actionLoading === 'cancel'}
            onClick={() => handleAction('cancel')}
            className="w-full text-slate-500 hover:text-slate-800"
          >
            <span>انصراف از پرداخت و بازگشت</span>
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
}

export default function SandboxPayPage() {
  return (
    <Suspense
      fallback={
        <MobileFrame>
          <div className="flex-1 flex items-center justify-center text-sm font-bold text-slate-500">
            در حال ارتباط با درگاه شبیه‌ساز...
          </div>
        </MobileFrame>
      }
    >
      <SandboxPayContent />
    </Suspense>
  );
}
