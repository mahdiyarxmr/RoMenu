'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Shield,
  Key,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { formatPrice } from '@/utils/formatters';

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [mode, setMode] = useState<'SANDBOX' | 'LIVE'>('SANDBOX');
  const [activeProvider, setActiveProvider] = useState('sandbox');
  const [minTopUp, setMinTopUp] = useState('10000');
  const [maxTopUp, setMaxTopUp] = useState('50000000');
  const [zarinpalSandbox, setZarinpalSandbox] = useState(true);

  // Credentials form
  const [zarinpalMerchant, setZarinpalMerchant] = useState('');

  const fetchSettings = () => {
    adminApi
      .getPaymentSettings()
      .then((data) => {
        setSettings(data);
        setMode(data.mode);
        setActiveProvider(data.activeProvider);
        setMinTopUp(String(data.minTopUpAmount));
        setMaxTopUp(String(data.maxTopUpAmount));
        setZarinpalSandbox(data.zarinpalSandbox ?? true);

        const creds = data.credentialsMasked || {};
        if (creds.zarinpal?.merchantId) setZarinpalMerchant(creds.zarinpal.merchantId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.updatePaymentSettings({
        mode,
        activeProvider,
        minTopUpAmount: Number(minTopUp),
        maxTopUpAmount: Number(maxTopUp),
        zarinpalSandbox,
      });
      alert('تنظیمات درگاه با موفقیت ذخیره شد');
      fetchSettings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCredentials = async (provider: string, keys: Record<string, string>) => {
    try {
      await adminApi.saveProviderCredentials(provider, keys);
      alert(`اطلاعات اتصال درگاه ${provider} با موفقیت رمزنگاری و ذخیره شد`);
      fetchSettings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ذخیره اطلاعات اتصال');
    }
  };

  const [isTestingZarinpal, setIsTestingZarinpal] = useState(false);
  const [zarinpalTestResult, setZarinpalTestResult] = useState<any>(null);

  const handleTestZarinpal = async () => {
    setIsTestingZarinpal(true);
    setZarinpalTestResult(null);
    try {
      const res = await adminApi.testZarinpalConnection();
      setZarinpalTestResult(res);
    } catch {
      setZarinpalTestResult({ success: false, message: 'خطا در برقراری ارتباط با وب‌سرویس زرین‌پال' });
    } finally {
      setIsTestingZarinpal(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">در حال دریافت تنظیمات درگاه...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#1E293B] dark:text-white">تنظیمات درگاه‌های پرداخت</h1>
        <p className="text-xs text-slate-500 mt-1">
          مدیریت حالت Sandbox/Live، انتخاب درگاه فعال و کلیدهای رمزنگاری‌شده بانکی
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. General Mode & Active Provider */}
        <form
          onSubmit={handleSaveGeneral}
          className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-[#242F42]">
            <Settings size={18} className="text-[#59BBAF]" />
            <h2 className="text-sm font-black text-[#1E293B] dark:text-white">پیکربندی کلی پرداخت</h2>
          </div>

          {/* Mode Switch */}
          <div>
            <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
              محیط پرداخت سراسری:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('SANDBOX')}
                className={`p-3 rounded-xl border-[1.5px] text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'SANDBOX'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <FlaskConical size={16} />
                <span>شبیه‌ساز (SANDBOX)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('LIVE')}
                className={`p-3 rounded-xl border-[1.5px] text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'LIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard size={16} />
                <span>درگاه واقعی (LIVE)</span>
              </button>
            </div>
          </div>

          {/* Active Provider */}
          <div>
            <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
              درگاه پرداخت فعال فروشگاه:
            </label>
            <select
              value={activeProvider}
              onChange={(e) => setActiveProvider(e.target.value)}
              className="w-full h-11 px-3 bg-white dark:bg-[#151C28] text-xs font-bold rounded-xl border border-slate-300 dark:border-[#242F42] focus:border-[#59BBAF]"
            >
              <option value="zarinpal">درگاه زرین‌پال نسخه ۴ (ZarinPal SandBox / Live)</option>
              <option value="sandbox">شبیه‌ساز داخلی سیستم (Offline Simulator)</option>
            </select>
          </div>

          {/* Zarinpal Sandbox Switch */}
          <div className="p-3 bg-slate-50 dark:bg-[#0B0F17] rounded-2xl border border-slate-200 dark:border-[#242F42] space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={zarinpalSandbox}
                onChange={(e) => setZarinpalSandbox(e.target.checked)}
                className="rounded"
              />
              <span>استفاده از محیط آزمایشی (سندباکس) زرین‌پال</span>
            </label>
            <p className="text-[10px] text-slate-400 pr-5">
              در صورت فعال بودن، درخواست‌ها به sandbox.zarinpal.com ارسال می‌شوند
            </p>
          </div>

          {/* Min & Max TopUp */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="حداقل شارژ کیف پول (تومان):"
              type="number"
              value={minTopUp}
              onChange={(e) => setMinTopUp(e.target.value)}
              required
            />
            <Input
              label="حداکثر شارژ کیف پول (تومان):"
              type="number"
              value={maxTopUp}
              onChange={(e) => setMaxTopUp(e.target.value)}
              required
            />
          </div>

          <Button type="submit" size="md" variant="primary" isLoading={isSaving} className="w-full">
            ذخیره تنظیمات درگاه
          </Button>
        </form>

        {/* 2. Gateway Credentials & Connections */}
        <div className="space-y-4">
          {/* Zarinpal Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#242F42]">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Key size={16} className="text-[#F8A41D]" />
                <span>اتصال درگاه زرین‌پال (ZarinPal REST v4)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestZarinpal}
                  disabled={isTestingZarinpal}
                  className="text-[11px] font-bold text-[#59BBAF] hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} className={isTestingZarinpal ? 'animate-spin' : ''} />
                  <span className="flex items-center gap-1">
                    <span>تست اتصال</span>
                    <FlaskConical size={12} />
                  </span>
                </button>
                <Badge variant={zarinpalSandbox ? 'warning' : 'success'} size="sm">
                  {zarinpalSandbox ? 'سندباکس' : 'لایو'}
                </Badge>
              </div>
            </div>

            {zarinpalTestResult && (
              <div
                className={`p-3 rounded-xl text-xs space-y-1 border ${
                  zarinpalTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {zarinpalTestResult.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{zarinpalTestResult.message}</span>
                </div>
                {zarinpalTestResult.authority && (
                  <div className="text-[10px] font-mono text-slate-500">
                    کلید تست سندباکس: {zarinpalTestResult.authority}
                  </div>
                )}
              </div>
            )}

            <Input
              label="مرچنت‌آیدی زرین‌پال (Merchant ID):"
              type="text"
              placeholder="مثلاً: 00000000-0000-0000-0000-000000000000"
              value={zarinpalMerchant}
              onChange={(e) => setZarinpalMerchant(e.target.value)}
              helperText="اطلاعات با الگوریتم AES-256-GCM در پایگاه داده رمزنگاری می‌شود"
            />

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSaveCredentials('zarinpal', { merchantId: zarinpalMerchant })}
              className="w-full"
            >
              ذخیره مرچنت زرین‌پال
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
