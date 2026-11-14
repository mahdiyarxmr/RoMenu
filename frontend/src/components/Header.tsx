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

  return (
    <header className="sticky top-0 z-30 w-full px-4 py-2.5 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#242F42] shadow-xs">
      <div className="relative flex items-center justify-between w-full h-10">
        {/* 1. Right Side (RTL Start): Admin Button or Spacer */}
        <div className="flex items-center justify-start z-10 min-w-[36px]">
          {isAdmin ? (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#59BBAF]/50 bg-[#EEF8F7] dark:bg-[#151C28] text-[#1F413D] dark:text-[#59BBAF] text-xs font-black transition-all hover:border-[#59BBAF] active:scale-95 shadow-xs"
              title="ورود به پنل مدیریت"
            >
              <Shield size={14} strokeWidth={2.5} className="text-[#59BBAF]" />
              <span className="hidden sm:inline">مدیریت</span>
            </Link>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* 2. Center: Centered Rokad Brand Logo ("بوفه رُکاد" وسط هدر) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Link
            href="/"
            className="pointer-events-auto flex items-center group transition-transform active:scale-95"
            title="صفحه اصلی بوفه رُکاد"
          >
            <RokadLogo size="md" variant="horizontal" showBadge={false} />
          </Link>
        </div>

        {/* 3. Left Side (RTL End): Actions (Theme Toggle) */}
        <div className="flex items-center justify-end z-10 min-w-[36px]">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl border border-slate-300 dark:border-[#242F42] bg-slate-50 dark:bg-[#151C28] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-all shadow-xs active:scale-95"
            title={darkMode ? 'حالت روشن' : 'حالت تاریک'}
          >
            {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
};
