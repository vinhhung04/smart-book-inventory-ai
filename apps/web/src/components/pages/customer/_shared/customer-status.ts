type StatusTone = {
  label: string;
  className: string;
};

const STATUS_STYLES: Record<string, StatusTone> = {
  ACTIVE: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OVERDUE: { label: 'Overdue', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  RETURNED: { label: 'Returned', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  OUT_OF_STOCK: { label: 'Out of stock', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  UNPAID: { label: 'Unpaid', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  PARTIALLY_PAID: { label: 'Partially paid', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  WAIVED: { label: 'Waived', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export function getStatusTone(status?: string | null): StatusTone {
  if (!status) {
    return { label: 'Unknown', className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }

  const normalized = status.toUpperCase();
  return STATUS_STYLES[normalized] || {
    label: status.replace(/_/g, ' ').toLowerCase().replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase()),
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}
