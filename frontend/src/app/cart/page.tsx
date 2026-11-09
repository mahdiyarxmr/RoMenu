'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Wallet as WalletIcon,
  CreditCard,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ordersApi, paymentsApi } from '@/services/api';
import { formatPrice, toPersianDigits } from '@/utils/formatters';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if any item in cart is marked sold out
  const hasSoldOutItems = items.some((item) => item.product.isSoldOut);

  // Fractional payment calculation
  const walletBalance = Number(user?.wallet?.balance || 0);
  const walletUsed = Math.min(walletBalance, totalAmount);
  const paymentDue = Math.max(0, totalAmount - walletUsed);

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (items.length === 0 || hasSoldOutItems) return;

    setIsSubmitting(true);
    try {
      const idempotencyKey = `cart-order-${Date.now()}`;
      const payload = {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        idempotencyKey,
      };

      const res = await ordersApi.create(payload);
      clearCart();

      if (!res.paymentNeeded) {
        // Full wallet payment completed immediately
        router.push(
          `/pay/result?status=success&orderId=${res.order.id}&message=${encodeURIComponent(
            'سفارش شما با موفقیت تسویه و ثبت شد',
          )}`,
        );
      } else if (res.paymentUrl) {
        // Direct redirect to ZarinPal SandBox StartPay
        if (res.paymentUrl.startsWith('/')) {
          router.push(res.paymentUrl);
        } else {
          window.location.href = res.paymentUrl;
        }
      } else {
        // Gateway payment required
        const payRes = await paymentsApi.startOrderPayment(res.order.id);
        if (payRes.redirectUrl.startsWith('/')) {
          router.push(payRes.redirectUrl);
        } else {
          window.location.href = payRes.redirectUrl;
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت سفارش');
      setIsSubmitting(false);
    }
  };

  return (
    <MobileFrame>
      <Header />

      <main className="flex-1 p-4 pb-28 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-[#1E293B] dark:text-white">سبد خرید بوفه</h1>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              {toPersianDigits(items.length)} قلم
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-bold text-[#EF4444] hover:underline"
            >
              پاک کردن سبد
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="سبد خرید شما خالی است"
            description="از منوی بوفه خوراکی‌های خوشمزه را انتخاب کنید"
            actionText="مشاهده منوی خوراکی‌ها"
            onAction={() => router.push('/')}
          />
        ) : (
          <div className="space-y-4">
            {/* Warning if sold out item present */}
            {hasSoldOutItems && (
              <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] border-[1.5px] border-[#EF4444] rounded-2xl text-xs font-bold text-[#B91C1C]">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span>برخی از اقلام سبد شما تمام شده‌اند. لطفاً آن‌ها را حذف کنید.</span>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className={`flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs transition-all ${
                    item.product.isSoldOut ? 'bg-red-50/50 dark:bg-red-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.imageUrl || '/placeholder.png'}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-[#1E293B] dark:text-white line-clamp-1">
                        {item.product.name}
                      </h4>
                      <div className="text-xs font-bold text-[#009966] dark:text-emerald-400">
                        {formatPrice(item.product.price)}
                      </div>
                      {item.product.isSoldOut && (
                        <span className="text-[10px] font-black text-[#EF4444]">ناموجود</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-[#0B0F17] rounded-xl border border-slate-300 dark:border-[#242F42] p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-[#1E293B] dark:text-white">
                        {toPersianDigits(item.quantity)}
                      </span>
                      <button
                        disabled={item.quantity >= 100 || item.product.isSoldOut}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-[#EF4444] transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Fractional Payment Breakdown Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-3">
              <h3 className="text-xs font-black text-[#1E293B] dark:text-white pb-2 border-b border-slate-200 dark:border-[#242F42]">
                جزئیات پرداخت کسری
              </h3>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">جمع اقلام سفارش:</span>
                <span className="font-bold text-[#1E293B] dark:text-white">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#59BBAF]">
                <div className="flex items-center gap-1.5 font-bold">
                  <WalletIcon size={14} />
                  <span>سهم کیف پول (موجودی: {formatPrice(walletBalance)}):</span>
                </div>
                <span className="font-black">− {formatPrice(walletUsed)}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-[#242F42]">
                <div className="flex items-center gap-1.5 font-bold text-[#202A5A] dark:text-white">
                  <CreditCard size={14} />
                  <span>کسری نیازمند پرداخت بانکی:</span>
                </div>
                <span className="text-sm font-black text-[#202A5A] dark:text-[#59BBAF]">
                  {formatPrice(paymentDue)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <Button
              size="lg"
              variant={paymentDue === 0 ? 'primary' : 'secondary'}
              disabled={hasSoldOutItems}
              isLoading={isSubmitting}
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 shadow-hard-md"
            >
              {paymentDue === 0 ? (
                <>
                  <CheckCircle size={18} />
                  <span>تسویه فوری کامل با کیف پول</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>پرداخت کسری با درگاه ({formatPrice(paymentDue)})</span>
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      <Navbar />
    </MobileFrame>
  );
}
