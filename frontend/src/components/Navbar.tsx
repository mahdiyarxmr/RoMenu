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
    <nav className="sticky bottom-0 z-40 w-full px-4 pb-3 pt-2 bg-white/85 dark:bg-[#0B0F17]/85 backdrop-blur-md border-t border-slate-200 dark:border-[#242F42]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative select-none ${
                isActive
                  ? 'text-[#1F413D] dark:text-[#59BBAF] font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#59BBAF]/20 text-[#1F413D] dark:text-[#59BBAF]' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E0195B] text-white text-[11px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0B0F17] shadow-sm animate-pulse">
                    {toPersianDigits(item.badge > 99 ? '۹۹+' : item.badge)}
                  </span>
                )}
              </div>
              <span className="text-[12px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
