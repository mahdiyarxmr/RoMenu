'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Sun, Shield } from 'lucide-react';
import { RokadLogo } from './RokadLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Header: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صبح بخیر ☀️';
    if (hour >= 12 && hour < 16) return 'ظهر بخیر 🥪';
    if (hour >= 16 && hour < 20) return 'عصر بخیر 🧃';
    return 'شب بخیر 🌙';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'مهمان';

  return (
    <header className="sticky top-0 z-30 w-full px-4 py-3 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b-2 border-slate-200 dark:border-[#242F42] flex items-center justify-between shadow-xs">
      {/* 1. Right Side (RTL Start): Official Rokad Brand Logo */}
      <Link href="/" className="flex items-center group transition-transform active:scale-95" title="صفحه اصلی بوفه رُکاد">
        <RokadLogo size="md" variant="horizontal" showBadge={false} />
      </Link>

      {/* 2. Center: Dynamic Greeting */}
      <div className="hidden min-[360px]:flex flex-col text-center">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {getGreeting()}
        </span>
        <span className="text-xs font-black text-[#1E293B] dark:text-white">
          {displayName} عزیز
        </span>
      </div>

      {/* 3. Left Side (RTL End): Actions (Theme Toggle & Admin) */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border-[1.5px] border-slate-300 dark:border-[#242F42] bg-slate-50 dark:bg-[#151C28] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-all shadow-xs active:scale-95"
          title={darkMode ? 'حالت روشن' : 'حالت تاریک'}
        >
          {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-[1.5px] border-[#202A5A] dark:border-[#59BBAF] bg-[#59BBAF] text-[#1F413D] text-xs font-black transition-all shadow-[2px_2px_0px_#202A5A] active:translate-x-0.5 active:translate-y-0.5"
            title="ورود به پنل مدیریت"
          >
            <Shield size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">مدیریت</span>
          </Link>
        )}
      </div>
    </header>
  );
};
