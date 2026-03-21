import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { CustomerStateBlock } from './_shared/customer-state-block';
import { SectionCard } from './_shared/section-card';
import { LoanCard } from './_shared/loan-card';
import { LoadingState } from './_shared/loading-state';
import { EmptyState } from './_shared/empty-state';

export function CustomerLoansPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerBorrowService.getMyLoans();
      setRows(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load loans'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Loans"
        subtitle={`${rows.length} active loan(s)`}
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
          <LoadingState message="Loading loans..." />
        ) : error ? (
          <CustomerStateBlock mode="error" message={error} />
        ) : rows.length === 0 ? (
          <EmptyState message="No loans found." />
        ) : (
          <div className="space-y-2.5">
            {rows.map((row) => (
              <LoanCard key={row.id} item={row} onView={(id) => navigate(`/customer/loans/${id}`)} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
