'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, ShoppingBag, ReceiptText, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toPersianDigits } from '../utils/formatters';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const navItems = [
    { label: 'منو', path: '/', icon: Store },
    { label: 'سبد خرید', path: '/cart', icon: ShoppingBag, badge: itemCount },
    { label: 'سفارش‌ها', path: '/orders', icon: ReceiptText },
    { label: 'حساب من', path: '/account', icon: User },
  ];

  return (
    <nav
      aria-label="ناوبری اصلی بوفه"
      className="fixed sm:absolute bottom-0 left-0 right-0 z-50 w-full bg-white/95 dark:bg-[#0D131F]/95 backdrop-blur-xl border-t-2 border-[#1E293B] dark:border-[#2A374A] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)] px-3 pt-2 pb-3 transition-all select-none"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all relative group active:scale-95 ${
                isActive
                  ? 'text-[#1F413D] dark:text-[#59BBAF]'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {/* Icon Container with Neo-Brutal Active State */}
              <div
                className={`relative p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#59BBAF] text-[#1F413D] border-[1.5px] border-[#202A5A] shadow-[2px_2px_0px_#202A5A] dark:shadow-[2px_2px_0px_#59BBAF]'
                    : 'group-hover:bg-slate-100 dark:group-hover:bg-[#1C2536]'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                {/* Live Cart Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#E0195B] text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0D131F] shadow-[1px_1px_0px_#202A5A] animate-bounce">
                    {toPersianDigits(item.badge > 99 ? '۹۹+' : item.badge)}
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[11px] mt-1 transition-all ${
                  isActive
                    ? 'font-black text-[#202A5A] dark:text-[#59BBAF]'
                    : 'font-semibold text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>

              {/* Active Dot Indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#59BBAF] border border-[#202A5A] dark:border-[#59BBAF] mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
