import { useEffect, useState } from 'react';
import { BookOpen, ShieldCheck, AlertCircle, Wallet } from 'lucide-react';
import { customerService, MembershipInfo } from '@/services/customer';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';

export function CustomerDashboardPage() {
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [membershipData, accountResponse] = await Promise.all([
          customerService.getMyMembership(),
          customerBorrowService.getMyAccount(),
        ]);

        setMembership(membershipData);
        setWalletBalance(Number(accountResponse?.data?.available_balance || 0));
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load customer dashboard'));
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  if (isLoading) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (!membership) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">No membership data available.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="rounded-[14px] border border-slate-200 bg-white p-5">
        <div className="text-slate-500 text-[12px]">Membership Plan</div>
        <div className="mt-1 text-[20px] text-slate-900" style={{ fontWeight: 700 }}>{membership.plan_name}</div>
        <div className="text-[12px] text-indigo-600 mt-1">{membership.plan_code}</div>
      </div>
      <div className="rounded-[14px] border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-1.5 text-slate-500 text-[12px]"><BookOpen className="w-3.5 h-3.5" />Active Loans</div>
        <div className="mt-1 text-[20px] text-slate-900" style={{ fontWeight: 700 }}>{membership.active_loan_count}</div>
        <div className="text-[12px] text-slate-500 mt-1">Remaining slots: {membership.remaining_loan_slots}</div>
      </div>
      <div className="rounded-[14px] border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-1.5 text-slate-500 text-[12px]"><ShieldCheck className="w-3.5 h-3.5" />Borrow Limits</div>
        <div className="mt-1 text-[20px] text-slate-900" style={{ fontWeight: 700 }}>{membership.limits.max_active_loans} books</div>
        <div className="text-[12px] text-slate-500 mt-1">{membership.limits.max_loan_days} days / loan</div>
      </div>
      <div className="rounded-[14px] border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-1.5 text-slate-500 text-[12px]"><Wallet className="w-3.5 h-3.5" />Wallet Balance</div>
        <div className="mt-1 text-[20px] text-slate-900" style={{ fontWeight: 700 }}>{walletBalance.toLocaleString('vi-VN')} VND</div>
        <div className="text-[12px] text-slate-500 mt-1">Used for auto-debit borrow fee</div>
      </div>
    </div>
  );
}
