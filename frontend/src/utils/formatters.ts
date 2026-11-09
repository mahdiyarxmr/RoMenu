// Persian digit mappings
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function formatPrice(amount: number | string | null | undefined, showUnit = true): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '۰' + (showUnit ? ' تومان' : '');
  const num = Math.round(Number(amount));
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  const persianFormatted = toPersianDigits(formatted);
  return showUnit ? `${persianFormatted} تومان` : persianFormatted;
}

export function formatDateTime(isoString: string | Date | null | undefined): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return String(isoString);
  }
}

export function formatDateShort(isoString: string | Date | null | undefined): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  } catch {
    return String(isoString);
  }
}
