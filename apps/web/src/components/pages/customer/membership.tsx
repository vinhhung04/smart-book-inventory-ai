import { useEffect, useState } from 'react';
import { customerService, MembershipInfo } from '@/services/customer';
import { getApiErrorMessage } from '@/services/api';
import { CustomerStateBlock } from './_shared/customer-state-block';
import { CustomerStatCard } from './_shared/customer-stat-card';
import { SectionCard } from './_shared/section-card';
import { InfoCard } from './_shared/info-card';

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
    return <CustomerStateBlock mode="loading" message="Loading membership..." />;
  }

  if (error) {
    return <CustomerStateBlock mode="error" message={error} />;
  }

  if (!membership) {
    return <CustomerStateBlock mode="empty" message="Membership not found." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 text-[13px] md:grid-cols-2 lg:grid-cols-4">
        <CustomerStatCard
          label="Plan"
          value={membership.plan_name}
          hint={<span className="text-indigo-600">{membership.plan_code}</span>}
        />
        <CustomerStatCard label="Max active loans" value={membership.limits.max_active_loans} />
        <CustomerStatCard label="Max loan days" value={`${membership.limits.max_loan_days} days`} />
        <CustomerStatCard label="Fine per day" value={membership.limits.fine_per_day} />
      </div>

      <SectionCard title="Additional Limits" subtitle="Policy details applied to your current membership plan.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoCard label="Renewal limit" value={`${membership.limits.max_renewal_count} times / loan`} />
          <InfoCard label="Reservation hold" value={`${membership.limits.reservation_hold_hours} hours`} />
          <InfoCard label="Lost item fee" value={`${membership.limits.lost_item_fee_multiplier}x base fee`} />
        </div>
      </SectionCard>
    </div>
  );
}
