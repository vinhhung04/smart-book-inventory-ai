import { useEffect, useState } from 'react';
import { customerService, MembershipInfo } from '@/services/customer';
import { getApiErrorMessage } from '@/services/api';

export function CustomerMembershipPage() {
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await customerService.getMyMembership();
        setMembership(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load membership'));
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  if (isLoading) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading membership...</div>;
  }

  if (error) {
    return <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>;
  }

  if (!membership) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Membership not found.</div>;
  }

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-6">
      <h2 className="text-[20px] tracking-[-0.02em]" style={{ fontWeight: 700 }}>My Membership</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
        <div className="p-3 rounded-[10px] border border-slate-200 bg-slate-50">
          <div className="text-slate-500 text-[12px]">Plan</div>
          <div className="text-slate-900 mt-1" style={{ fontWeight: 600 }}>{membership.plan_name} ({membership.plan_code})</div>
        </div>
        <div className="p-3 rounded-[10px] border border-slate-200 bg-slate-50">
          <div className="text-slate-500 text-[12px]">Max active loans</div>
          <div className="text-slate-900 mt-1" style={{ fontWeight: 600 }}>{membership.limits.max_active_loans}</div>
        </div>
        <div className="p-3 rounded-[10px] border border-slate-200 bg-slate-50">
          <div className="text-slate-500 text-[12px]">Max loan days</div>
          <div className="text-slate-900 mt-1" style={{ fontWeight: 600 }}>{membership.limits.max_loan_days} days</div>
        </div>
        <div className="p-3 rounded-[10px] border border-slate-200 bg-slate-50">
          <div className="text-slate-500 text-[12px]">Fine per day</div>
          <div className="text-slate-900 mt-1" style={{ fontWeight: 600 }}>{membership.limits.fine_per_day}</div>
        </div>
      </div>
    </div>
  );
}
