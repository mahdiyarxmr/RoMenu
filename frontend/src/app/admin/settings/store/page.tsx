'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles, Store, Clock, Plus, Star } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useTheme, StoreTheme } from '@/context/ThemeContext';

const THEMES: {
  id: StoreTheme;
  title: string;
  badge: string;
  description: string;
  previewBg: string;
  accentColor: string;
}[] = [
  {
    id: 'neo-brutal',
    title: 'نئوبروتالیسم رُکاد (Neo-Brutalism)',
    badge: 'تم رسمی پیش‌فرض',
    description: 'خطوط جوهری باکنتراست، سایه‌های سخت فیزیکی آفست، فیزیک دکمه‌های فشاری مکانیکی و دارک‌مود عمیق.',
    previewBg: 'bg-[#EEF8F7]',
    accentColor: '#59BBAF',
  },
  {
    id: 'rokad-sticker',
    title: 'استیکر چانکی (Rokad Sticker)',
    badge: 'جذاب و پرانرژی',
    description: 'بردرهای ضخیم ۲ پیکسلی، چرخش کارت‌ها در هاور، دکمه‌های برجسته الهام‌گرفته از استیکرهای فیزیکی.',
    previewBg: 'bg-[#E9EAEF]',
    accentColor: '#202A5A',
  },
  {
    id: 'minimal-premium',
    title: 'مینیمال شیک (Minimal Premium)',
    badge: 'ساده و مدرن',
    description: 'خطوط مویی ظریف، گوشه‌های شارپ، منوی خطی مدرن، سایه‌های لطیف با طراحی ارگونومیک.',
    previewBg: 'bg-slate-100',
    accentColor: '#1E293B',
  },
  {
    id: 'dark-neon',
    title: 'نئون سایبرپانک (Dark Neon)',
    badge: 'تاریک و درخشان',
    description: 'پس‌زمینه مشکی ابسیدین عمیق با درخشش نئونی بنفش و صورتی روی کارت‌ها و دکمه‌ها.',
    previewBg: 'bg-[#0A0D14]',
    accentColor: '#8A38F5',
  },
  {
    id: 'soft-playful',
    title: 'پاستیلی نرم (Soft Playful)',
    badge: 'شاداب و گرد',
    description: 'گوشه‌های بسیار گرد، سایه‌های محو نرم، پالت پاستیلی آرامش‌بخش و انیمیشن‌های حبابی.',
    previewBg: 'bg-[#FCE8EF]',
    accentColor: '#E0195B',
  },
];

export default function AdminStoreSettingsPage() {
  const { theme, setTheme, storeName: ctxStoreName, refreshSettings } = useTheme();
  const [storeName, setStoreName] = useState(ctxStoreName);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState<StoreTheme | null>(null);

  useEffect(() => {
    setStoreName(ctxStoreName);
  }, [ctxStoreName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.updateStoreSettings({
        storeName,
        activeTheme: theme,
      });
      alert('تنظیمات فروشگاه و تم با موفقیت ذخیره شد');
      refreshSettings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTheme = (thId: StoreTheme) => {
    setTheme(thId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#1E293B] dark:text-white">تنظیمات فروشگاه و هویت بصری</h1>
        <p className="text-xs text-slate-500 mt-1">
          شخصی‌سازی نام فروشگاه، تم‌های طراحی ۵گانه با پیش‌نمایش زنده در لحظه
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Name Input */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#242F42]">
            <Store size={18} className="text-[#59BBAF]" />
            <h2 className="text-sm font-black text-[#1E293B] dark:text-white">نام و عنوان بوفه</h2>
          </div>

          <div className="max-w-md">
            <Input
              label="نام فروشگاه بوفه:"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="مثلاً: بوفه رُکاد"
              required
            />
          </div>
        </div>

        {/* 5 Themes Selection Grid with Live Preview */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#242F42]">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-[#E0195B]" />
              <h2 className="text-sm font-black text-[#1E293B] dark:text-white">
                زبان‌های طراحی ۵گانه (سوییچ آنی تم)
              </h2>
            </div>
            <span className="text-xs font-bold text-[#59BBAF]">تم انتخابی فعال: {theme}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEMES.map((th) => {
              const isSelected = theme === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => handleSelectTheme(th.id)}
                  onMouseEnter={() => setHoveredTheme(th.id)}
                  onMouseLeave={() => setHoveredTheme(null)}
                  className={`p-4 rounded-2xl border-[2px] transition-all cursor-pointer space-y-3 relative overflow-hidden select-none ${
                    isSelected
                      ? 'border-[#202A5A] dark:border-[#59BBAF] shadow-hard-md bg-slate-50 dark:bg-slate-800/80 ring-2 ring-[#59BBAF]/20'
                      : 'border-slate-200 dark:border-[#242F42] hover:border-slate-400 bg-white dark:bg-[#151C28]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: th.accentColor }} />
                      <span className="text-xs font-black text-[#1E293B] dark:text-white">{th.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {th.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {th.description}
                  </p>

                  {/* Micro Preview Card */}
                  <div className={`p-3 rounded-xl ${th.previewBg} flex items-center justify-between border border-black/10`}>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">پیش‌نمایش دکمه بوفه</span>
                    <button
                      type="button"
                      className="px-3 py-1 bg-white text-xs font-black rounded-lg border border-black/20 shadow-sm inline-flex items-center gap-1"
                      style={{ color: th.accentColor }}
                    >
                      <span>خرید</span>
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" variant="primary" isLoading={isSaving} className="shadow-hard-md">
          ذخیره تغییرات فروشگاه
        </Button>
      </form>
    </div>
  );
}
