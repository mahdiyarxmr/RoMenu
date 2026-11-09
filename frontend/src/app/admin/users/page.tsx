'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Wallet, Plus, Minus, Shield, Check, X, AlertCircle } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { formatPrice, toPersianDigits } from '@/utils/formatters';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Adjustment Modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const fetchUsers = () => {
    adminApi
      .getUsers(search)
      .then((data) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleActive = async (user: any) => {
    try {
      await adminApi.toggleUserActive(user.id, !user.isActive);
      fetchUsers();
    } catch {
      alert('خطا در تغییر وضعیت کاربر');
    }
  };

  const handleOpenAdjust = (user: any, type: 'CREDIT' | 'DEBIT') => {
    setSelectedUser(user);
    setAdjustType(type);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustError('');
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason.trim()) {
      setAdjustError('ثبت دلیل تغییر دستی موجودی اجباری است');
      return;
    }
    const num = Number(adjustAmount);
    if (!num || num <= 0) {
      setAdjustError('مبلغ نامعتبر است');
      return;
    }

    setIsSubmitting(true);
    setAdjustError('');
    try {
      await adminApi.adjustUserWallet(selectedUser.id, {
        amount: num,
        type: adjustType,
        reason: adjustReason,
      });
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'خطا در ثبت تغییر موجودی');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white">مدیریت کاربران و کیف پول‌ها</h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده، افزایش یا کسر دستی موجودی و مدیریت دسترسی کاربران بوفه
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="جست‌وجوی نام یا شماره موبایل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:outline-none focus:border-[#59BBAF]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#242F42] text-slate-400 font-bold pb-2.5">
                <th className="pb-2.5">کاربر</th>
                <th className="pb-2.5">شماره موبایل</th>
                <th className="pb-2.5">نقش</th>
                <th className="pb-2.5">موجودی کیف پول</th>
                <th className="pb-2.5">وضعیت</th>
                <th className="pb-2.5 text-left">عملیات مالی و دسترسی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242F42]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    در حال بارگذاری کاربران...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    کاربری با این مشخصات یافت نشد
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 font-bold text-[#1E293B] dark:text-white">{u.name}</td>
                    <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {toPersianDigits(u.mobile)}
                    </td>
                    <td className="py-3.5">
                      <Badge variant={u.role === 'admin' ? 'primary' : 'neutral'} size="sm">
                        {u.role === 'admin' ? 'مدیر سیستم' : 'دانش‌آموز'}
                      </Badge>
                    </td>
                    <td className="py-3.5 font-black text-[#202A5A] dark:text-[#59BBAF]">
                      {formatPrice(u.wallet?.balance ?? 0)}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          u.isActive ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                        }`}
                        title={u.isActive ? 'فعال' : 'غیرفعال'}
                      />
                    </td>
                    <td className="py-3.5 text-left">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenAdjust(u, 'CREDIT')}
                          className="px-2.5 py-1 bg-[#ECFDF5] hover:bg-emerald-100 text-[#059669] rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                          title="شارژ دستی کیف پول"
                        >
                          <Plus size={13} strokeWidth={3} />
                          <span>شارژ</span>
                        </button>

                        <button
                          onClick={() => handleOpenAdjust(u, 'DEBIT')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#EF4444] rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                          title="کسر دستی موجودی"
                        >
                          <Minus size={13} strokeWidth={3} />
                          <span>کسر</span>
                        </button>

                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1 rounded-lg border text-xs ${
                            u.isActive
                              ? 'border-slate-300 text-slate-500 hover:text-red-500'
                              : 'border-emerald-400 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'غیرفعال‌سازی کاربر' : 'فعال‌سازی کاربر'}
                        >
                          {u.isActive ? <X size={14} /> : <Check size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Wallet Adjustment Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={
          adjustType === 'CREDIT'
            ? `افزایش دستی موجودی (${selectedUser?.name})`
            : `کسر دستی موجودی (${selectedUser?.name})`
        }
      >
        <form onSubmit={handleSubmitAdjustment} className="space-y-4">
          {adjustError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-[#EF4444]">
              {adjustError}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] text-xs flex justify-between border border-slate-200 dark:border-[#242F42]">
            <span>موجودی کنونی کاربر:</span>
            <span className="font-bold">{formatPrice(selectedUser?.wallet?.balance ?? 0)}</span>
          </div>

          <Input
            label="مبلغ تغییر (تومان):"
            type="number"
            placeholder="مثلاً: ۵۰۰۰۰"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
              دلیل اجباری تغییر دستی:
            </label>
            <textarea
              rows={3}
              placeholder="مثلاً: واریز نقدی در بوفه / تصحیح خطای سفارش #۱۲۳"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full p-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:border-[#59BBAF] focus:outline-none"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="md"
              variant={adjustType === 'CREDIT' ? 'primary' : 'danger'}
              isLoading={isSubmitting}
              className="flex-1"
            >
              ثبت تغییر در کیف پول و لاگ
            </Button>
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={() => setSelectedUser(null)}
            >
              انصراف
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
