import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

export function CustomerLoanDetailPage() {
  const { id } = useParams();
  const [loan, setLoan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingRenew, setIsSubmittingRenew] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await customerBorrowService.getMyLoanById(id);
      setLoan(response?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load loan detail'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleRenewRequest = async () => {
    if (!id) return;
    try {
      setIsSubmittingRenew(true);
      await customerBorrowService.requestLoanRenewal(id);
      toast.success('Renewal request submitted');
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to request renewal'));
    } finally {
      setIsSubmittingRenew(false);
    }
  };

  if (loading) return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading loan detail...</div>;
  if (error) return <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>;
  if (!loan) return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loan not found.</div>;

  return (
    <div className="space-y-4">
      <NavLink to="/customer/loans" className="text-[12px] text-indigo-600 hover:text-indigo-700" style={{ fontWeight: 600 }}>Back to loans</NavLink>
      <div className="rounded-[14px] border border-slate-200 bg-white p-6">
        <h2 className="text-[20px]" style={{ fontWeight: 700 }}>{loan.loan_number}</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[13px]">
          <div><span className="text-slate-500">Status:</span> {loan.status}</div>
          <div><span className="text-slate-500">Borrow date:</span> {new Date(loan.borrow_date).toLocaleString()}</div>
          <div><span className="text-slate-500">Due date:</span> {new Date(loan.due_date).toLocaleString()}</div>
          <div><span className="text-slate-500">Total items:</span> {loan.total_items}</div>
        </div>

        <div className="mt-5">
          <h3 className="text-[13px] text-slate-700" style={{ fontWeight: 600 }}>Loan Items</h3>
          {(loan.loan_items || []).length === 0 ? (
            <div className="text-[13px] text-slate-500 mt-2">No items.</div>
          ) : (
            <div className="mt-2 space-y-2">
              {loan.loan_items.map((item: any) => (
                <div key={item.id} className="rounded-[10px] border border-slate-200 p-3 text-[13px]">
                  <div><span className="text-slate-500">Variant:</span> {item.variant_id}</div>
                  <div><span className="text-slate-500">Status:</span> {item.status}</div>
                  <div><span className="text-slate-500">Due:</span> {new Date(item.due_date).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={() => void handleRenewRequest()} disabled={isSubmittingRenew} className="px-4 py-2.5 rounded-[10px] bg-indigo-600 text-white text-[13px] disabled:opacity-60">
            {isSubmittingRenew ? 'Submitting...' : 'Request Renewal'}
          </button>
        </div>
      </div>
    </div>
  );
}
