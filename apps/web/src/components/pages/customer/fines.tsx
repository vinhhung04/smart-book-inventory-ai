import { useEffect, useState } from 'react';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

export function CustomerFinesPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingFineId, setPayingFineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFines = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerBorrowService.getMyFines();
      setData(response?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load fines'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFines();
  }, []);

  const getRemainingBalance = (fine: any) => {
    const paid = (fine?.fine_payments || []).reduce(
      (sum: number, payment: any) => sum + Number(payment?.amount || 0),
      0,
    );
    return Math.max(0, Number(fine?.amount || 0) - Number(fine?.waived_amount || 0) - paid);
  };

  const payFine = async (fine: any, mode: 'FULL' | 'PARTIAL') => {
    const remaining = getRemainingBalance(fine);
    if (remaining <= 0) {
      toast.info('This fine is already settled');
      return;
    }

    const amount = mode === 'FULL' ? remaining : Number((remaining / 2).toFixed(2));

    try {
      setPayingFineId(String(fine.id));
      await customerBorrowService.payFine({
        fine_id: fine.id,
        amount,
        payment_method: 'EWALLET',
      });
      toast.success(mode === 'FULL' ? 'Fine paid successfully' : 'Partial payment recorded');
      await loadFines();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to pay fine'));
    } finally {
      setPayingFineId(null);
    }
  };

  if (loading) return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading fines...</div>;
  if (error) return <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>;

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-6">
      <h2 className="text-[18px]" style={{ fontWeight: 700 }}>My Fines</h2>
      <div className="mt-3 text-[14px]">
        <span className="text-slate-500">Outstanding balance:</span>{' '}
        <span style={{ fontWeight: 700 }}>{Number(data?.total_fine_balance || 0).toLocaleString('vi-VN')} VND</span>
      </div>
      <div className="mt-4 text-[12px] text-slate-500">Fine records: {(data?.fines || []).length} | Payments: {(data?.fine_payments || []).length}</div>

      <div className="mt-5 space-y-3">
        {(data?.fines || []).length === 0 ? (
          <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-500">No fines found.</div>
        ) : (
          (data?.fines || []).map((fine: any) => {
            const remaining = getRemainingBalance(fine);
            const disabled = remaining <= 0 || payingFineId === String(fine.id);

            return (
              <div key={fine.id} className="rounded-[12px] border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px]" style={{ fontWeight: 700 }}>Type: {fine.fine_type}</div>
                    <div className="text-[12px] text-slate-500">Status: {fine.status}</div>
                    <div className="text-[12px] text-slate-500">Issued: {new Date(fine.issued_at).toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="text-right text-[12px]">
                    <div>Total: {Number(fine.amount || 0).toLocaleString('vi-VN')} VND</div>
                    <div>Remaining: <span style={{ fontWeight: 700 }}>{remaining.toLocaleString('vi-VN')} VND</span></div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    disabled={disabled}
                    onClick={() => void payFine(fine, 'PARTIAL')}
                    className="rounded-[8px] border border-slate-300 px-3 py-1.5 text-[12px] disabled:opacity-60"
                  >
                    Pay 50%
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() => void payFine(fine, 'FULL')}
                    className="rounded-[8px] bg-emerald-600 px-3 py-1.5 text-[12px] text-white disabled:opacity-60"
                  >
                    Pay Full
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
