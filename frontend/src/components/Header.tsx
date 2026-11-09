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
    <header className="sticky top-0 z-30 w-full px-4 py-3 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#242F42] flex items-center justify-between">
      {/* Left side actions: Theme toggle & Admin shortcut */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-slate-200 dark:border-[#242F42] bg-slate-50 dark:bg-[#151C28] text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          title={darkMode ? 'حالت روشن' : 'حالت تاریک'}
        >
          {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#202A5A] dark:border-[#59BBAF] bg-[#EEF8F7] dark:bg-[#151C28] text-[#1F413D] dark:text-[#59BBAF] text-xs font-bold transition-all shadow-sm"
            title="ورود به پنل مدیریت"
          >
            <Shield size={14} />
            <span className="hidden sm:inline">مدیریت</span>
          </Link>
        )}
      </div>

      {/* Center: Greeting */}
      <div className="text-center">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {getGreeting()}
        </div>
        <div className="text-sm font-black text-[#1E293B] dark:text-white">
          {displayName} عزیز
        </div>
      </div>

      {/* Right side: Rokad Logo */}
      <Link href="/" className="flex items-center">
        <RokadLogo size="sm" />
      </Link>
    </header>
  );
};
