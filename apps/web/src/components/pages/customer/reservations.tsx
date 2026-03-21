import { useEffect, useState } from 'react';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';
import { CustomerStateBlock } from './_shared/customer-state-block';
import { SectionCard } from './_shared/section-card';
import { ReservationCard } from './_shared/reservation-card';
import { LoadingState } from './_shared/loading-state';
import { EmptyState } from './_shared/empty-state';

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

  return (
    <div className="space-y-4">
      <SectionCard
        title="Reservations"
        subtitle={`${rows.length} reservation(s)`}
        actions={
          <button
            onClick={() => void load()}
            className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50"
            style={{ fontWeight: 600 }}
          >
            Refresh
          </button>
        }
      >
        {loading ? (
          <LoadingState message="Loading reservations..." />
        ) : error ? (
          <CustomerStateBlock mode="error" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState message="No reservations found." />
        ) : (
          <div className="space-y-2.5">
            {rows.map((row) => (
              <ReservationCard key={row.id} item={row} onCancel={(id) => void handleCancel(id)} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
