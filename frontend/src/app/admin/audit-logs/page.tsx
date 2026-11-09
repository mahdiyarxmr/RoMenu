'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Eye, Terminal } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { AuditLog } from '@/types';
import { formatDateTime } from '@/utils/formatters';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = () => {
    adminApi
      .getAuditLogs({ search: search.trim() || undefined, limit: 50 })
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white">لاگ‌های مدیریتی و نظارت (Audit Log)</h1>
          <p className="text-xs text-slate-500 mt-1">
            ثبت غیرقابل تغییر کلیه اقدامات حساس ادمین‌ها، تغییرات موجودی و درگاه‌ها
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="جست‌وجوی اقدام، موجودیت یا ادمین..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:outline-none focus:border-[#59BBAF]"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#242F42] text-slate-400 font-bold pb-2.5">
                <th className="pb-2.5">اقدام ثبت‌شده</th>
                <th className="pb-2.5">موجودیت (Entity)</th>
                <th className="pb-2.5">شناسه هدف</th>
                <th className="pb-2.5">ادمین ثبت‌کننده</th>
                <th className="pb-2.5">زمان وقوع</th>
                <th className="pb-2.5 text-left">جزئیات تغییر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242F42]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    در حال دریافت لاگ‌های مدیریتی...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لاگی یافت نشد
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-[#1E293B] dark:text-white">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{log.entity}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">
                      {log.entityId ? log.entityId.slice(0, 12) : '—'}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">
                      {log.adminName || 'مدیر بوفه'}
                    </td>
                    <td className="py-3 text-[11px] text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 text-left">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#59BBAF] transition-colors"
                        title="مشاهده جزئیات لاگ"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`جزئیات تغییرات لاگ: ${selectedLog?.action}`}
      >
        {selectedLog && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-[#242F42]">
              <span className="text-slate-500">موجودیت: {selectedLog.entity}</span>
              <span className="text-slate-400">{formatDateTime(selectedLog.createdAt)}</span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                داده‌های قبل و بعد (JSON):
              </span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60" dir="ltr">
                {selectedLog.details
                  ? JSON.stringify(
                      typeof selectedLog.details === 'string'
                        ? JSON.parse(selectedLog.details)
                        : selectedLog.details,
                      null,
                      2
                    )
                  : 'بدون جزئیات داده‌ای'}
              </pre>
            </div>

            <Button size="md" variant="outline" onClick={() => setSelectedLog(null)} className="w-full">
              بستن
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
