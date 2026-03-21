import { useEffect, useState } from 'react';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';
import { CustomerStateBlock } from './_shared/customer-state-block';
import { formatCurrencyVnd, formatDateTime } from './_shared/customer-format';
import { SectionCard } from './_shared/section-card';
import { FineCard } from './_shared/fine-card';
import { LoadingState } from './_shared/loading-state';
import { EmptyState } from './_shared/empty-state';
import { CustomerStatCard } from './_shared/customer-stat-card';

export function CustomerFinesPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingFineId, setPayingFineId] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState('50000');
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [accountSnapshot, setAccountSnapshot] = useState<any | null>(null);
  const [ledgerRows, setLedgerRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadFines = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerBorrowService.getMyFines();
      setData(response?.data || null);

      const [accountResponse, ledgerResponse] = await Promise.all([
        customerBorrowService.getMyAccount(),
        customerBorrowService.getMyAccountLedger({ page: 1, pageSize: 5 }),
      ]);

      setAccountSnapshot(accountResponse?.data || null);
      setLedgerRows(Array.isArray(ledgerResponse?.data) ? ledgerResponse.data : []);
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

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Topup amount must be greater than 0');
      return;
    }

    try {
      setIsTopupLoading(true);
      await customerBorrowService.topupMyAccount({ amount, note: 'Topup from customer portal' });
      toast.success('Wallet topup successful');
      await loadFines();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to topup wallet'));
    } finally {
      setIsTopupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingState message="Loading fines..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <CustomerStateBlock mode="error" message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <CustomerStatCard label="Outstanding balance" value={formatCurrencyVnd(data?.total_fine_balance)} />
        <CustomerStatCard label="Wallet balance" value={formatCurrencyVnd(accountSnapshot?.available_balance)} />
        <SectionCard title="Top up wallet" className="p-4">
          <div className="flex items-center gap-2">
            <input
              value={topupAmount}
              onChange={(event) => setTopupAmount(event.target.value)}
              className="h-10 w-full rounded-[10px] border border-slate-200 px-3 text-[13px]"
              inputMode="numeric"
            />
            <button
              onClick={() => void handleTopup()}
              disabled={isTopupLoading}
              className="h-10 rounded-[10px] bg-indigo-600 px-3 text-[12px] text-white hover:bg-indigo-700 disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {isTopupLoading ? 'Processing...' : 'Top up'}
            </button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Fine Records"
        subtitle={`Fine records: ${(data?.fines || []).length} | Payments: ${(data?.fine_payments || []).length}`}
      >
        <div className="space-y-2.5">
          {(data?.fines || []).length === 0 ? (
            <EmptyState message="No fines found." />
          ) : (
            (data?.fines || []).map((fine: any) => (
              <FineCard
                key={fine.id}
                fine={fine}
                paying={payingFineId === String(fine.id)}
                onPay={(item, mode) => void payFine(item, mode)}
              />
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title="Recent Wallet Ledger">
        {ledgerRows.length === 0 ? (
          <EmptyState message="No ledger entries yet." />
        ) : (
          <div className="space-y-2.5">
            {ledgerRows.map((entry) => (
              <div key={entry.id} className="rounded-[10px] border border-slate-200 bg-white p-3 text-[12px] text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <div>{entry.entry_type || entry.reference_type || 'Entry'}</div>
                  <div style={{ fontWeight: 700 }}>{formatCurrencyVnd(entry.amount)}</div>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">{formatDateTime(entry.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
