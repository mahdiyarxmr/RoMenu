'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Upload,
  History,
  AlertCircle,
  Check,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Product, InventoryMovement } from '@/types';
import { formatPrice, formatDateTime, toPersianDigits } from '@/utils/formatters';

const CATEGORIES = ['نوشیدنی', 'ساندویچ', 'تنقلات', 'کیک و شیرینی'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [restockReason, setRestockReason] = useState('');
  const [setExact, setSetExact] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);

  // Movements history modal state
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch admin products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct({
      name: '',
      price: 50000,
      category: 'نوشیدنی',
      description: '',
      imageUrl: '',
      isActive: true,
      trackInventory: true,
      stock: 50,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsEditModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await adminApi.uploadProductImage(file);
      setEditingProduct((prev) => (prev ? { ...prev, imageUrl: res.url } : null));
    } catch {
      alert('خطا در بارگذاری تصویر محصول');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      if (editingProduct.id) {
        await adminApi.updateProduct(editingProduct.id, editingProduct);
      } else {
        await adminApi.createProduct(editingProduct);
      }
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ذخیره محصول');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('آیا از حذف این خوراکی از منوی بوفه اطمینان دارید؟')) return;
    try {
      await adminApi.deleteProduct(id);
      fetchProducts();
    } catch {
      alert('خطا در حذف محصول');
    }
  };

  const handleOpenRestock = (p: Product) => {
    setRestockProduct(p);
    setQuantityChange('');
    setRestockReason('');
    setSetExact(false);
  };

  const handleSubmitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    if (!restockReason.trim()) {
      alert('ثبت دلیل تغییر موجودی الزامی است');
      return;
    }
    const val = Number(quantityChange);
    if (isNaN(val)) return;

    setIsRestocking(true);
    try {
      await adminApi.restockProduct(restockProduct.id, {
        quantityChange: val,
        reason: restockReason,
        setExact,
      });
      setRestockProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ثبت موجودی');
    } finally {
      setIsRestocking(false);
    }
  };

  const handleOpenMovements = async (p: Product) => {
    setMovementProduct(p);
    setMovementsLoading(true);
    try {
      const data = await adminApi.getProductMovements(p.id);
      setMovements(data);
    } catch {
      setMovements([]);
    } finally {
      setMovementsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1E293B] dark:text-white">محصولات و مدیریت انبار</h1>
          <p className="text-xs text-slate-500 mt-1">
            تعریف، قیمت‌گذاری، شارژ انبار و تاریخچه گردش موجودی خوراکی‌های بوفه
          </p>
        </div>

        <Button size="md" variant="primary" onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={16} strokeWidth={2.5} />
          <span>افزودن خوراکی جدید</span>
        </Button>
      </div>

      {/* Products Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#242F42] text-slate-400 font-bold pb-2.5">
                <th className="pb-2.5">محصول</th>
                <th className="pb-2.5">دسته‌بندی</th>
                <th className="pb-2.5">قیمت فروش</th>
                <th className="pb-2.5">موجودی انبار</th>
                <th className="pb-2.5">وضعیت</th>
                <th className="pb-2.5 text-left">عملیات انبار و ویرایش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242F42]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    در حال بارگذاری محصولات...
                  </td>
                </tr>
              ) : !Array.isArray(products) || products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    هنوز محصولی ثبت نشده است
                  </td>
                </tr>
              ) : (
                (products || []).map((p) => {
                  const currentStock = p.stock ?? 0;
                  const isLow = p.trackInventory && currentStock <= 5;
                  const isSoldOut = p.trackInventory && currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.imageUrl || '/placeholder.png'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-[#1E293B] dark:text-white block">
                              {p.name}
                            </span>
                            {p.description && (
                              <span className="text-[10px] text-slate-400 line-clamp-1">
                                {p.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <Badge variant="neutral" size="sm">
                          {p.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 font-black text-[#009966] dark:text-emerald-400">
                        {formatPrice(p.price)}
                      </td>
                      <td className="py-3.5 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            isSoldOut
                              ? 'bg-red-50 text-[#EF4444] border border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {toPersianDigits(p.stock)} عدد
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            p.isActive ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                          }`}
                          title={p.isActive ? 'فعال' : 'غیرفعال'}
                        />
                      </td>
                      <td className="py-3.5 text-left">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenRestock(p)}
                            className="px-2 py-1 bg-[#EEF8F7] hover:bg-[#CCEAE6] text-[#1F413D] rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                            title="تنظیم موجودی انبار"
                          >
                            <Sliders size={13} />
                            <span>موجودی</span>
                          </button>

                          <button
                            onClick={() => handleOpenMovements(p)}
                            className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-[#59BBAF]"
                            title="تاریخچه گردش انبار"
                          >
                            <History size={15} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-500"
                            title="ویرایش خوراکی"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingProduct?.id ? 'ویرایش خوراکی بوفه' : 'افزودن خوراکی جدید'}
      >
        {editingProduct && (
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <Input
              label="نام خوراکی یا نوشیدنی"
              value={editingProduct.name || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="قیمت فروش (تومان)"
                type="number"
                value={editingProduct.price ?? ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                required
              />

              <div>
                <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
                  دسته‌بندی
                </label>
                <select
                  value={editingProduct.category || 'نوشیدنی'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full h-11 px-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:border-[#59BBAF]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
                توضیحات خوراکی
              </label>
              <textarea
                rows={2}
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full p-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:border-[#59BBAF]"
              />
            </div>

            {/* Image URL & Upload */}
            <div className="space-y-2">
              <Input
                label="آدرس تصویر (URL)"
                value={editingProduct.imageUrl || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                placeholder="https://..."
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-200">
                  <Upload size={14} />
                  <span>{uploadingImage ? 'در حال آپلود...' : 'آپلود عکس از کامپیوتر (حداکثر ۳MB)'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.isActive ?? true}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                  className="rounded"
                />
                <span>محصول در ویترین فعال و قابل سفارش باشد</span>
              </label>
            </div>

            <div className="flex gap-2 pt-3">
              <Button type="submit" size="md" variant="primary" isLoading={isSaving} className="flex-1">
                ذخیره اطلاعات محصول
              </Button>
              <Button type="button" size="md" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                انصراف
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Restock Modal */}
      <Modal
        isOpen={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        title={`تنظیم موجودی انبار (${restockProduct?.name})`}
      >
        {restockProduct && (
          <form onSubmit={handleSubmitRestock} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] text-xs flex justify-between border border-slate-200 dark:border-[#242F42]">
              <span>موجودی فعلی در سیستم:</span>
              <span className="font-bold">{toPersianDigits(restockProduct.stock)} عدد</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={!setExact}
                  onChange={() => setSetExact(false)}
                />
                <span>افزایش / کاهش نسبی (شارژ انبار)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={setExact}
                  onChange={() => setSetExact(true)}
                />
                <span>تنظیم دقیق موجودی انبارگردانی</span>
              </label>
            </div>

            <Input
              label={setExact ? 'موجودی دقیق انبارگردانی:' : 'تعداد تغییر (مثبت برای شارژ، منفی برای کسر):'}
              type="number"
              placeholder={setExact ? '50' : '20 یا -5'}
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
                دلیل اجباری تغییر موجودی:
              </label>
              <textarea
                rows={2}
                placeholder="مثلاً: خرید فاکتور شماره ۱۲ / تاریخ انقضا / مغایرت انبارگردانی"
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
                className="w-full p-3 bg-white dark:bg-[#151C28] text-xs rounded-xl border border-slate-300 dark:border-[#242F42] focus:border-[#59BBAF]"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="md" variant="primary" isLoading={isRestocking} className="flex-1">
                ثبت تغییر موجودی
              </Button>
              <Button type="button" size="md" variant="outline" onClick={() => setRestockProduct(null)}>
                انصراف
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Movements History Modal */}
      <Modal
        isOpen={!!movementProduct}
        onClose={() => setMovementProduct(null)}
        title={`تاریخچه گردش انبار (${movementProduct?.name})`}
      >
        <div className="space-y-3">
          {movementsLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">در حال دریافت تاریخچه...</div>
          ) : movements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">گردشی برای این محصول ثبت نشده است</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#242F42] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span
                      className={
                        m.quantityChange > 0
                          ? 'text-[#059669]'
                          : m.quantityChange < 0
                          ? 'text-[#EF4444]'
                          : 'text-slate-500'
                      }
                    >
                      {m.type === 'RESTOCK'
                        ? 'شارژ موجودی'
                        : m.type === 'INITIAL'
                        ? 'موجودی اولیه'
                        : m.type === 'SALE'
                        ? 'فروش بوفه'
                        : m.type === 'RESERVE'
                        ? 'رزرو سفارش'
                        : m.type === 'RELEASE'
                        ? 'آزادسازی رزرو'
                        : 'انبارگردانی'}
                      : {m.quantityChange > 0 ? `+${toPersianDigits(m.quantityChange)}` : toPersianDigits(m.quantityChange)}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(m.createdAt)}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] flex justify-between">
                    <span>{m.reason || 'بدون توضیح'}</span>
                    <span>
                      {toPersianDigits(m.stockBefore)} → {toPersianDigits(m.stockAfter)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button size="md" variant="outline" onClick={() => setMovementProduct(null)} className="w-full">
            بستن
          </Button>
        </div>
      </Modal>
    </div>
  );
}
