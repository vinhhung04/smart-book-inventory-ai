import { useEffect, useState } from 'react';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { CustomerStateBlock } from './_shared/customer-state-block';
import { SectionCard } from './_shared/section-card';
import { NotificationListItem } from './_shared/notification-list-item';
import { LoadingState } from './_shared/loading-state';
import { EmptyState } from './_shared/empty-state';

export function CustomerNotificationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  useEffect(() => {
    void loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerBorrowService.getMyNotifications();
      setRows(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = rows.filter((row) => {
    if (filter === 'UNREAD') return !row.read_at;
    if (filter === 'READ') return Boolean(row.read_at);
    return true;
  });

  const unreadRows = filteredRows.filter((row) => !row.read_at);
  const readRows = filteredRows.filter((row) => Boolean(row.read_at));

  return (
    <div className="space-y-4">
      <SectionCard
        title="Notifications"
        subtitle={`${rows.length} notification(s)`}
        actions={
          <button onClick={() => void loadNotifications()} className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50" style={{ fontWeight: 600 }}>
            Refresh
          </button>
        }
      >
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-[9px] px-2.5 py-1.5 text-[11px] ${filter === 'ALL' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            style={{ fontWeight: 600 }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`rounded-[9px] px-2.5 py-1.5 text-[11px] ${filter === 'UNREAD' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            style={{ fontWeight: 600 }}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('READ')}
            className={`rounded-[9px] px-2.5 py-1.5 text-[11px] ${filter === 'READ' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            style={{ fontWeight: 600 }}
          >
            Read
          </button>
        </div>

        {loading ? (
          <LoadingState message="Loading notifications..." />
        ) : error ? (
          <CustomerStateBlock mode="error" message={error} />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            message={filter === 'ALL' ? 'No notifications yet. Check back later for reminders and account updates.' : `No ${filter.toLowerCase()} notifications.`}
            action={
              <button
                onClick={() => void loadNotifications()}
                className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50"
                style={{ fontWeight: 600 }}
              >
                Refresh list
              </button>
            }
          />
        ) : filter === 'ALL' ? (
          <div className="space-y-3">
            {unreadRows.length > 0 ? (
              <div className="rounded-[12px] border border-cyan-200 bg-cyan-50/60 p-2.5">
                <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.05em] text-cyan-700" style={{ fontWeight: 700 }}>
                  Unread ({unreadRows.length})
                </p>
                <div className="space-y-2">
                  {unreadRows.map((row) => (
                    <NotificationListItem key={row.id} item={row} />
                  ))}
                </div>
              </div>
            ) : null}

            {readRows.length > 0 ? (
              <div className="rounded-[12px] border border-slate-200 bg-white p-2.5">
                <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.05em] text-slate-500" style={{ fontWeight: 700 }}>
                  Read ({readRows.length})
                </p>
                <div className="space-y-2">
                  {readRows.map((row) => (
                    <NotificationListItem key={row.id} item={row} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRows.map((row) => (
              <NotificationListItem key={row.id} item={row} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
