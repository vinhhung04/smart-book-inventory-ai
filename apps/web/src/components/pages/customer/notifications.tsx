import { useEffect, useState } from 'react';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';

export function CustomerNotificationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
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

    void run();
  }, []);

  if (loading) return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading notifications...</div>;
  if (error) return <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>;

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-[18px]" style={{ fontWeight: 700 }}>My Notifications</h2>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-[13px] text-slate-500">No notifications yet.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.id} className="p-4">
              <div className="text-[13px]" style={{ fontWeight: 600 }}>{row.subject || row.template_code || 'Notification'}</div>
              <div className="text-[13px] text-slate-600 mt-1">{row.body}</div>
              <div className="text-[11px] text-slate-500 mt-1">{new Date(row.created_at || row.scheduled_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
