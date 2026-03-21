import { Bell, CalendarClock, CircleAlert, CircleCheckBig } from 'lucide-react';
import { formatDateTime } from './customer-format';

interface NotificationItemProps {
  item: any;
}

function pickIcon(code: string) {
  const normalized = code.toUpperCase();
  if (normalized.includes('OVERDUE') || normalized.includes('FINE')) return CircleAlert;
  if (normalized.includes('READY') || normalized.includes('REMINDER')) return CalendarClock;
  if (normalized.includes('SUCCESS') || normalized.includes('APPROVED')) return CircleCheckBig;
  return Bell;
}

export function NotificationItem({ item }: NotificationItemProps) {
  const Icon = pickIcon(String(item.template_code || item.subject || ''));
  const unread = !item.read_at;

  return (
    <div className={`rounded-[12px] border p-3.5 ${unread ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-[9px] border border-slate-200 bg-white p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] text-slate-900" style={{ fontWeight: 700 }}>{item.subject || item.template_code || 'Notification'}</div>
            {unread ? <span className="rounded-[8px] bg-indigo-100 px-2 py-0.5 text-[10px] uppercase text-indigo-700">Unread</span> : null}
          </div>
          <div className="mt-1.5 text-[13px] text-slate-600">{item.body}</div>
          <div className="mt-1.5 text-[11px] text-slate-500">{formatDateTime(item.created_at || item.scheduled_at)}</div>
        </div>
      </div>
    </div>
  );
}
