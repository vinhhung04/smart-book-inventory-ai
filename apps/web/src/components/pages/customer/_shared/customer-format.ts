export function formatDateTime(value?: string | null, locale = 'vi-VN') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(locale);
}

export function formatCurrencyVnd(value?: number | string | null) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')} VND`;
}

export function toNumber(value?: number | string | null) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}
