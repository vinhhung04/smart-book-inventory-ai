import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeItem } from '../motion-utils';
import { StatusBadge } from '../status-badge';
import { borrowService, type Fine } from '@/services/borrow';
import { getApiErrorMessage } from '@/services/api';

function getVariant(status: string) {
  if (status === 'PAID') return 'success';
  if (status === 'WAIVED') return 'neutral';
  if (status === 'UNPAID') return 'warning';
  return 'info';
}

export function BorrowFinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED'>('ALL');

  const loadFines = async () => {
    try {
      setLoading(true);
      const response = await borrowService.getFines();
      setFines(response.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load fines'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFines();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return fines.filter((fine) => {
      if (statusFilter !== 'ALL' && fine.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        fine.id.toLowerCase().includes(keyword)
        || fine.customers?.full_name?.toLowerCase().includes(keyword)
        || fine.customers?.customer_code?.toLowerCase().includes(keyword)
        || fine.fine_type.toLowerCase().includes(keyword)
      );
    });
  }, [fines, query, statusFilter]);

  const viewDetail = async (id: string) => {
    try {
      const detail = await borrowService.getFineById(id);
      const remaining = Number(detail.data.summary?.remaining_balance || 0).toLocaleString('vi-VN');
      toast.message(`Fine ${id}`, {
        description: `Type: ${detail.data.fine_type} | Remaining: ${remaining} VND | Status: ${detail.data.status}`,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load fine detail'));
    }
  };

  const recordPayment = async (fine: Fine) => {
    const remaining = Number(fine.summary?.remaining_balance || 0);
    if (remaining <= 0) {
      toast.error('No remaining balance to pay');
      return;
    }

    const raw = window.prompt(`Enter payment amount (remaining ${remaining.toLocaleString('vi-VN')} VND):`, String(remaining));
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Payment amount must be a positive number');
      return;
    }

    try {
      await borrowService.recordFinePayment(fine.id, {
        amount,
        payment_method: 'CASH',
      });
      toast.success('Fine payment recorded');
      await loadFines();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to record fine payment'));
    }
  };

  const waiveFine = async (fine: Fine) => {
    const remaining = Number(fine.summary?.remaining_balance || 0);
    if (remaining <= 0) {
      toast.error('No remaining balance to waive');
      return;
    }

    const raw = window.prompt(`Enter waive/reduce amount (remaining ${remaining.toLocaleString('vi-VN')} VND):`, String(remaining));
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Waive amount must be a positive number');
      return;
    }

    const note = window.prompt('Waive reason (optional):', '') || undefined;

    try {
      await borrowService.waiveFine(fine.id, { amount, note });
      toast.success('Fine waived/reduced');
      await loadFines();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to waive fine'));
    }
  };

  return (
    <PageWrapper className="space-y-5">
      <FadeItem>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="tracking-[-0.02em]">Borrow Fines</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{fines.length} fines</p>
          </div>
          <button
            onClick={() => void loadFines()}
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
              placeholder="Search fine..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose-100/60 rounded-[10px] text-[13px] outline-none focus:ring-[3px] focus:ring-rose-500/10 focus:border-rose-300/60 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200/60 rounded-[10px] p-[3px] shadow-sm overflow-x-auto">
            {(['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'WAIVED'] as const).map((status) => (
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
                {['Fine', 'Customer', 'Type', 'Amount', 'Remaining', 'Status', 'Action'].map((header) => (
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
                    <LoaderCircle className="w-4 h-4 inline mr-2 animate-spin" /> Loading fines...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-[13px] text-slate-400">No fines found</td>
                </tr>
              ) : (
                filtered.map((fine) => (
                  <tr key={fine.id} className="border-b border-slate-50 last:border-0 hover:bg-rose-50/20 transition-all">
                    <td className="px-5 py-3.5 text-[13px] text-slate-700" style={{ fontWeight: 550 }}>{fine.id.slice(0, 8)}</td>
                    <td className="px-5 py-3.5 text-[13px]">{fine.customers?.full_name || fine.customer_id}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{fine.fine_type}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{Number(fine.amount || 0).toLocaleString('vi-VN')} VND</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{Number(fine.summary?.remaining_balance || 0).toLocaleString('vi-VN')} VND</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={fine.status} variant={getVariant(fine.status)} dot />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void viewDetail(fine.id)}
                          className="px-2.5 py-1 rounded-[6px] border border-slate-200 bg-slate-50 text-slate-700 text-[11px] hover:bg-slate-100 transition-all"
                          style={{ fontWeight: 550 }}
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => void recordPayment(fine)}
                          disabled={Number(fine.summary?.remaining_balance || 0) <= 0}
                          className="px-2.5 py-1 rounded-[6px] border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] hover:bg-emerald-100 transition-all disabled:opacity-50"
                          style={{ fontWeight: 550 }}
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => void waiveFine(fine)}
                          disabled={Number(fine.summary?.remaining_balance || 0) <= 0}
                          className="px-2.5 py-1 rounded-[6px] border border-amber-200 bg-amber-50 text-amber-700 text-[11px] hover:bg-amber-100 transition-all disabled:opacity-50"
                          style={{ fontWeight: 550 }}
                        >
                          Waive/Reduce
                        </button>
                      </div>
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
