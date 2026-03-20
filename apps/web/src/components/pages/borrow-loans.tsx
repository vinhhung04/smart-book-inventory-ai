import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { LoaderCircle, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeItem } from '../motion-utils';
import { StatusBadge } from '../status-badge';
import { borrowService, type Loan, type LoanStatus } from '@/services/borrow';
import { getApiErrorMessage } from '@/services/api';

const statuses: LoanStatus[] = ['RESERVED', 'BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'CANCELLED'];

function getVariant(status: LoanStatus) {
  if (status === 'BORROWED') return 'info';
  if (status === 'RETURNED') return 'success';
  if (status === 'OVERDUE' || status === 'LOST') return 'warning';
  if (status === 'CANCELLED') return 'neutral';
  return 'primary';
}

export function BorrowLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LoanStatus>('ALL');

  const loadLoans = async () => {
    try {
      setLoading(true);
      const response = await borrowService.getLoans();
      setLoans(response.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load loans'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLoans();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return loans.filter((loan) => {
      if (statusFilter !== 'ALL' && loan.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        loan.loan_number.toLowerCase().includes(keyword)
        || loan.customers?.full_name?.toLowerCase().includes(keyword)
        || loan.customer_id.toLowerCase().includes(keyword)
      );
    });
  }, [loans, query, statusFilter]);

  const returnLoan = async (loanId: string) => {
    if (!window.confirm('Return all active items in this loan?')) return;

    try {
      await borrowService.returnLoan(loanId, {});
      toast.success('Loan returned successfully');
      await loadLoans();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to return loan'));
    }
  };

  return (
    <PageWrapper className="space-y-5">
      <FadeItem>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="tracking-[-0.02em]">Borrow Loans</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{loans.length} loans</p>
          </div>
          <button
            onClick={() => void loadLoans()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-white border border-slate-200 text-slate-700 text-[13px] hover:bg-slate-50 transition-all"
            style={{ fontWeight: 550 }}
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loan..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose-100/60 rounded-[10px] text-[13px] outline-none focus:ring-[3px] focus:ring-rose-500/10 focus:border-rose-300/60 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200/60 rounded-[10px] p-[3px] shadow-sm overflow-x-auto">
            {(['ALL', ...statuses] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-[8px] text-[12px] whitespace-nowrap transition-all duration-160 ${statusFilter === status ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                style={{ fontWeight: 550 }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="bg-white rounded-[16px] border border-white/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-rose-50/40 to-transparent">
                {['Loan', 'Customer', 'Borrow Date', 'Due Date', 'Items', 'Status', 'Action'].map((header) => (
                  <th key={header} className="text-left text-[11px] text-slate-400 px-5 py-3 uppercase tracking-[0.05em]" style={{ fontWeight: 550 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-[13px] text-slate-400">
                    <LoaderCircle className="w-4 h-4 inline mr-2 animate-spin" /> Loading loans...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-[13px] text-slate-400">No loans found</td>
                </tr>
              ) : (
                filtered.map((loan) => (
                  <tr key={loan.id} className="border-b border-slate-50 last:border-0 hover:bg-rose-50/20 transition-all">
                    <td className="px-5 py-3.5 text-[13px]" style={{ fontWeight: 550 }}>
                      <Link to={`/borrow/loans/${loan.id}`} className="text-rose-700 hover:underline">{loan.loan_number}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]">{loan.customers?.full_name || loan.customer_id}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{new Date(loan.borrow_date).toLocaleString('vi-VN')}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{new Date(loan.due_date).toLocaleString('vi-VN')}</td>
                    <td className="px-5 py-3.5 text-[13px]">{loan.total_items}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={loan.status} variant={getVariant(loan.status)} dot />
                    </td>
                    <td className="px-5 py-3.5">
                      {loan.status === 'BORROWED' || loan.status === 'OVERDUE' || loan.status === 'RESERVED' ? (
                        <button
                          onClick={() => void returnLoan(loan.id)}
                          className="px-2.5 py-1 rounded-[6px] border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] hover:bg-emerald-100 transition-all"
                          style={{ fontWeight: 550 }}
                        >
                          Return
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeItem>
    </PageWrapper>
  );
}
