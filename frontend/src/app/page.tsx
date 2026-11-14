'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Check,
  Flame,
  ArrowLeft,
  LayoutGrid,
  CupSoda,
  Sandwich,
  Popcorn,
  Cookie,
} from 'lucide-react';
import { MobileFrame } from '@/components/MobileFrame';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { EmptyState } from '@/components/EmptyState';
import { WalletCard } from '@/components/WalletCard';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productsApi } from '@/services/api';
import { Product } from '@/types';
import { formatPrice } from '@/utils/formatters';

const CATEGORIES = [
  { id: 'all', label: 'همه', icon: LayoutGrid },
  { id: 'نوشیدنی', label: 'نوشیدنی', icon: CupSoda },
  { id: 'ساندویچ', label: 'ساندویچ', icon: Sandwich },
  { id: 'تنقلات', label: 'تنقلات', icon: Popcorn },
  { id: 'کیک و شیرینی', label: 'شیرینی', icon: Cookie },
];

export default function HomePage() {
  const { user } = useAuth();
  const { addItem, itemCount, totalAmount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    productsApi
      .getAll()
      .then((data) => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.isSoldOut) return;
    addItem(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 900);
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const specialOffers = products.filter((p) => !p.isSoldOut).slice(0, 5);

  return (
    <MobileFrame>
      <Header />

      <main className="flex-1 p-4 pb-36 space-y-4">
        {/* 1. Wallet Digital Pass Card */}
        <WalletCard />

        {/* 2. Sticky Search */}
        <div className="sticky top-[57px] z-20 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md py-1">
          <div className="relative flex items-center">
            <div className="absolute right-3.5 text-slate-400 pointer-events-none">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="جست‌وجوی خوراکی، نوشیدنی، ساندویچ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pr-10 pl-4 bg-slate-50 dark:bg-[#151C28] text-sm text-[#1E293B] dark:text-white rounded-xl border-[1.5px] border-slate-300 dark:border-[#242F42] focus:border-[#59BBAF] focus:outline-none placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        {/* 3. Category Filter Chips (Consistent Lucide Icons) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-[1.5px] ${
                  isActive
                    ? 'bg-[#202A5A] text-white border-[#0B0F1F] shadow-hard-xs dark:bg-[#59BBAF] dark:text-[#1F413D] dark:border-[#59BBAF]'
                    : 'bg-white dark:bg-[#151C28] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#242F42] hover:bg-slate-50 dark:hover:bg-[#1C2638]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-inherit' : 'text-[#59BBAF]'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Special Offers Rail (Horizontal Scroll) */}
        {!searchQuery && selectedCategory === 'all' && specialOffers.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#202A5A] dark:text-white">
                <Flame size={16} className="text-[#E0195B]" />
                <span>پیشنهادهای ویژه زنگ تفریح</span>
              </div>
              <span className="text-[11px] font-bold text-[#59BBAF]">داغ و تازه</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
              {specialOffers.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="w-40 flex-shrink-0 bg-white dark:bg-[#151C28] rounded-2xl border-[1.5px] border-slate-300 dark:border-[#242F42] p-2.5 shadow-hard-xs hover:-translate-y-1 transition-all rk-special-card flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                    <img
                      src={item.imageUrl || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 right-1.5 bg-[#E0195B] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                      محبوب
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E293B] dark:text-white line-clamp-1 mb-1">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-black text-[#009966] dark:text-emerald-400">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        onClick={(e) => handleQuickAdd(e, item)}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                          addedIds[item.id]
                            ? 'bg-[#10B981] text-white border-[#059669]'
                            : 'bg-[#EEF8F7] dark:bg-slate-800 text-[#1F413D] dark:text-[#59BBAF] border-[#59BBAF] hover:bg-[#59BBAF] hover:text-white'
                        }`}
                        title="افزودن سریع به سبد"
                      >
                        {addedIds[item.id] ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. Main Product List Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#1E293B] dark:text-white">منوی بوفه رُکاد</h3>
            <span className="text-xs text-slate-400 font-bold">{filteredProducts.length} قلم</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300 dark:border-slate-700"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="موردی یافت نشد"
              description="خوراکی مورد نظرتان را پیدا نکردید؟ دسته دیگری را بررسی کنید."
              actionText="نمایش همه خوراکی‌ها"
              onAction={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {filteredProducts.map((product) => {
                const isAdded = addedIds[product.id];
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={`flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs hover:-translate-y-0.5 transition-all select-none ${
                      product.isSoldOut ? 'opacity-70 grayscale' : ''
                    }`}
                  >
                    {/* Right side: Image + Details */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <img
                          src={product.imageUrl || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.isSoldOut && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="text-white text-[10px] font-black bg-[#EF4444] px-1 py-0.5 rounded">
                              تمام شد
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#1E293B] dark:text-white line-clamp-1">
                            {product.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            {product.category}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                        <div className="text-xs font-black text-[#009966] dark:text-emerald-400">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </div>

                    {/* Left side: Add Button */}
                    <div className="pl-1">
                      {product.isSoldOut ? (
                        <span className="text-[11px] font-bold text-[#EF4444] px-2 py-1 bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 rounded-lg">
                          ناموجود
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleQuickAdd(e, product)}
                          className={`w-9 h-9 rounded-xl border-[1.5px] flex items-center justify-center font-bold transition-all shadow-sm ${
                            isAdded
                              ? 'bg-[#10B981] text-white border-[#059669]'
                              : 'bg-[#59BBAF] text-[#1F413D] border-[#202A5A] dark:border-[#59BBAF] hover:bg-[#50A89E] active:scale-90'
                          }`}
                          title="افزودن به سبد خرید"
                        >
                          {isAdded ? (
                            <Check size={18} strokeWidth={3} />
                          ) : (
                            <Plus size={18} strokeWidth={3} />
                          )}
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Cart Quick-Bar with Generous Clearance Above Fixed Bottom Nav */}
      {itemCount > 0 && (
        <div className="fixed sm:absolute bottom-[88px] left-0 right-0 z-40 px-3 w-full max-w-[430px] mx-auto animate-in fade-in slide-in-from-bottom duration-200 pointer-events-none">
          <Link
            href="/cart"
            className="pointer-events-auto flex items-center justify-between p-3.5 bg-[#141D2B]/95 dark:bg-[#141D2B]/95 backdrop-blur-xl text-white rounded-2xl border-[1.5px] border-[#59BBAF]/50 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:border-[#59BBAF] transition-all group select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#59BBAF] text-[#0F1722] flex items-center justify-center font-black text-xs shadow-sm">
                {itemCount}
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-300">سبد خرید شما</div>
                <div className="text-sm font-black text-[#59BBAF]">
                  {formatPrice(totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black bg-[#59BBAF] text-[#0F1722] px-3.5 py-1.5 rounded-xl shadow-xs group-hover:-translate-x-1 transition-transform">
              <span>تکمیل خرید</span>
              <ArrowLeft size={15} />
            </div>
          </Link>
        </div>
      )}

      <Navbar />
    </MobileFrame>
  );
}
