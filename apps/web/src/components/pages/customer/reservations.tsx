import { useEffect, useState } from 'react';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

export function CustomerReservationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerBorrowService.getMyReservations();
      setRows(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reservations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await customerBorrowService.cancelReservation(id);
      toast.success('Reservation cancelled');
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to cancel reservation'));
    }
  };

  if (loading) return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading reservations...</div>;
  if (error) return <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>;

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-[18px]" style={{ fontWeight: 700 }}>My Reservations</h2>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-[13px] text-slate-500">No reservations found.</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">Reservation</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">Status</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">Reserved At</th>
              <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">Expires At</th>
              <th className="text-right px-4 py-2.5 text-[11px] uppercase text-slate-500"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 border-slate-50">
                <td className="px-4 py-3 text-[13px]" style={{ fontWeight: 600 }}>{row.reservation_number}</td>
                <td className="px-4 py-3 text-[13px] text-slate-600">{row.status}</td>
                <td className="px-4 py-3 text-[12px] text-slate-500">{new Date(row.reserved_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-[12px] text-slate-500">{new Date(row.expires_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => void handleCancel(row.id)} className="text-[12px] text-rose-600 hover:text-rose-700" style={{ fontWeight: 600 }}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
