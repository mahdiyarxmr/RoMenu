'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Plus, Minus, ShoppingBag, Zap, CheckCircle2 } from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { productsApi, ordersApi } from '@/services/api';
import { Product } from '@/types';
import { formatPrice, toPersianDigits } from '@/utils/formatters';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { addItem } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirectBuying, setIsDirectBuying] = useState(false);

  useEffect(() => {
    if (!id) return;
    productsApi
      .getById(id)
      .then((data) => setProduct(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <MobileFrame>
        <Header />
        <div className="flex-1 p-4 space-y-4">
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300 dark:border-[#242F42]" />
          <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <Navbar />
      </MobileFrame>
    );
  }

  if (!product) {
    return (
      <MobileFrame>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-base font-bold text-[#1E293B] dark:text-white mb-2">محصول یافت نشد</h3>
          <Link href="/">
            <Button size="sm">بازگشت به منوی بوفه</Button>
          </Link>
        </div>
        <Navbar />
      </MobileFrame>
    );
  }

  const liveTotal = product.price * quantity;

  const handleAddToCartAndGo = () => {
    setIsSubmitting(true);
    addItem(product, quantity);
    router.push('/cart');
  };

  const handleDirectBuy = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsDirectBuying(true);
    try {
      const idempotencyKey = `direct-buy-${product.id}-${Date.now()}`;
      const res = await ordersApi.create({
        items: [{ productId: product.id, quantity }],
        idempotencyKey,
      });

      if (!res.paymentNeeded) {
        // Immediate completion
        router.push(`/pay/result?status=success&orderId=${res.order.id}&message=${encodeURIComponent('سفارش شما با موفقیت از محل کیف پول ثبت شد')}`);
      } else {
        // Start gateway payment
        router.push(`/orders/${res.order.id}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت سفارش مستقیم');
    } finally {
      setIsDirectBuying(false);
    }
  };

  return (
    <MobileFrame>
      <Header />

      <main className="flex-1 p-4 pb-24 space-y-4">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#59BBAF] transition-colors"
          >
            <ArrowRight size={16} />
            <span>بازگشت به منو</span>
          </Link>
          <Badge variant="primary" size="sm">
            {product.category}
          </Badge>
        </div>

        {/* Product Image */}
        <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-md">
          <img
            src={product.imageUrl || '/placeholder.png'}
            alt={product.name}
            className={`w-full h-full object-cover transition-all ${
              product.isSoldOut ? 'grayscale' : ''
            }`}
          />
          {product.isSoldOut && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-sm font-black bg-[#EF4444] px-4 py-1.5 rounded-xl border border-white/40 shadow-lg">
                این خوراکی تمام شده است
              </span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2 pt-1">
          <h1 className="text-lg font-black text-[#1E293B] dark:text-white leading-tight">
            {product.name}
          </h1>
          {product.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#151C28] p-3 rounded-2xl border border-slate-200 dark:border-[#242F42]">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Quantity Stepper */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">قیمت واحد</span>
            <span className="text-base font-black text-[#009966] dark:text-white">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#242F42]">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تعداد سفارش</span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#0B0F17] p-1.5 rounded-xl border border-slate-300 dark:border-[#242F42]">
              <button
                disabled={quantity <= 1 || product.isSoldOut}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#151C28] border border-slate-300 dark:border-[#242F42] flex items-center justify-center font-bold disabled:opacity-30 active:scale-95 transition-all text-[#1E293B] dark:text-white"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-black text-[#1E293B] dark:text-white">
                {toPersianDigits(quantity)}
              </span>
              <button
                disabled={quantity >= 100 || product.isSoldOut}
                onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#151C28] border border-slate-300 dark:border-[#242F42] flex items-center justify-center font-bold disabled:opacity-30 active:scale-95 transition-all text-[#1E293B] dark:text-white"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#242F42]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">جمع کل</span>
            <span className="text-lg font-black text-[#202A5A] dark:text-[#59BBAF]">
              {formatPrice(liveTotal)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            size="lg"
            variant="primary"
            disabled={product.isSoldOut}
            isLoading={isSubmitting}
            onClick={handleAddToCartAndGo}
            className="w-full flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            <span>افزودن به سبد و تسویه</span>
          </Button>

          <Button
            size="md"
            variant="secondary"
            disabled={product.isSoldOut}
            isLoading={isDirectBuying}
            onClick={handleDirectBuy}
            className="w-full flex items-center justify-center gap-2"
          >
            <Zap size={16} className="text-amber-400" />
            <span>خرید مستقیم فوری (تک‌قلمی)</span>
          </Button>
        </div>
      </main>

      <Navbar />
    </MobileFrame>
  );
}
