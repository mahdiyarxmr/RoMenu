'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Settings,
  Palette,
  ShieldCheck,
  Menu,
  X,
  Store,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RokadLogo } from '@/components/RokadLogo';
import { useTheme } from '@/context/ThemeContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'داشبورد', path: '/admin', icon: LayoutDashboard },
    { label: 'کاربران و کیف پول', path: '/admin/users', icon: Users },
    { label: 'محصولات و موجودی', path: '/admin/products', icon: Package },
    { label: 'سفارش‌ها', path: '/admin/orders', icon: ShoppingBag },
    { label: 'پرداخت‌ها', path: '/admin/payments', icon: CreditCard },
    { label: 'گزارش فروش', path: '/admin/reports', icon: BarChart3 },
    { label: 'تنظیمات درگاه', path: '/admin/settings/payment', icon: Settings },
    { label: 'تنظیمات و تم‌ها', path: '/admin/settings/store', icon: Palette },
    { label: 'لاگ‌های سیستم', path: '/admin/audit-logs', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col md:flex-row text-right font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white dark:bg-[#151C28] border-l-[1.5px] border-slate-300 dark:border-[#242F42] shadow-sm z-30">
        {/* Brand Header */}
        <div className="p-5 border-b-[1.5px] border-slate-200 dark:border-[#242F42] flex items-center justify-between">
          <Link href="/admin">
            <RokadLogo size="md" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-[#202A5A] text-white border-[#0B0F1F] shadow-hard-xs dark:bg-[#59BBAF] dark:text-[#1F413D] dark:border-[#59BBAF]'
                    : 'text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t-[1.5px] border-slate-200 dark:border-[#242F42] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1E293B] dark:text-white line-clamp-1">
              {user?.name || 'مدیر سیستم'}
            </span>
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300"
              title="تغییر حالت تم"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Store size={14} />
              <span>مشاهده بوفه</span>
            </Link>
            <button
              onClick={logout}
              className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-[#EF4444] rounded-xl transition-colors"
              title="خروج"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#151C28] border-b border-slate-200 dark:border-[#242F42] z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#242F42]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <RokadLogo size="sm" variant="icon" />
            <span className="text-sm font-black text-[#202A5A] dark:text-white">مدیریت بوفه</span>
          </div>
        </div>
        <Link href="/" className="text-xs font-bold text-[#59BBAF]">
          ویترین بوفه
        </Link>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-64 h-full bg-white dark:bg-[#151C28] p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="text-sm font-black text-[#202A5A] dark:text-white pb-3 border-b border-slate-200 dark:border-[#242F42]">
                ناوبری مدیریت
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                      pathname === item.path
                        ? 'bg-[#202A5A] text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-[#242F42] flex items-center justify-between">
              <button onClick={toggleDarkMode} className="text-xs font-bold">
                {darkMode ? 'حالت روز' : 'حالت شب'}
              </button>
              <button onClick={logout} className="text-xs font-bold text-[#EF4444]">
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
