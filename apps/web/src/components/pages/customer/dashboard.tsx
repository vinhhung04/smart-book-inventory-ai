import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { AlertCircle, Bell, BookOpen, CalendarClock, HandCoins, ReceiptText, Wallet } from 'lucide-react';
import { customerService, MembershipInfo } from '@/services/customer';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { SectionCard } from './_shared/section-card';
import { CustomerStateBlock } from './_shared/customer-state-block';
import { CustomerStatCard } from './_shared/customer-stat-card';
import { formatCurrencyVnd } from './_shared/customer-format';
import { QuickActionCard } from './_shared/quick-action-card';
import { LoanCard } from './_shared/loan-card';
import { ReservationCard } from './_shared/reservation-card';

export function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [fineBalance, setFineBalance] = useState<number>(0);
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
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

        const [loansResponse, reservationsResponse, finesResponse, notificationsResponse] = await Promise.all([
          customerBorrowService.getMyLoans(),
          customerBorrowService.getMyReservations(),
          customerBorrowService.getMyFines(),
          customerBorrowService.getMyNotifications(),
        ]);

        setMembership(membershipData);
        setWalletBalance(Number(accountResponse?.data?.available_balance || 0));
        setFineBalance(Number(finesResponse?.data?.total_fine_balance || 0));
        setRecentLoans(Array.isArray(loansResponse?.data) ? loansResponse.data.slice(0, 3) : []);
        setRecentReservations(Array.isArray(reservationsResponse?.data) ? reservationsResponse.data.slice(0, 3) : []);
        setRecentNotifications(Array.isArray(notificationsResponse?.data) ? notificationsResponse.data.slice(0, 4) : []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load customer dashboard'));
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  if (isLoading) {
    return <CustomerStateBlock mode="loading" message="Loading dashboard..." />;
  }

  if (error) {
    return <CustomerStateBlock mode="error" message={error} />;
  }

  if (!membership) {
    return <CustomerStateBlock mode="empty" message="No membership data available." />;
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Welcome Back"
        subtitle="Your library account snapshot for today."
        actions={
          <div className="flex items-center gap-2">
            <NavLink to="/customer/books" className="rounded-[10px] bg-indigo-600 px-3 py-2 text-[12px] text-white hover:bg-indigo-700" style={{ fontWeight: 600 }}>
              Browse Books
            </NavLink>
            <NavLink to="/customer/loans" className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50" style={{ fontWeight: 600 }}>
              View Loans
            </NavLink>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <CustomerStatCard
            label="Membership Plan"
            value={membership.plan_name}
            hint={<span className="text-indigo-600">{membership.plan_code}</span>}
            variant="info"
          />
          <CustomerStatCard
            label="Active Loans"
            value={membership.active_loan_count}
            hint={`Remaining slots: ${membership.remaining_loan_slots}`}
            icon={<BookOpen className="w-3.5 h-3.5" />}
            variant="default"
          />
          <CustomerStatCard
            label="Outstanding Fines"
            value={formatCurrencyVnd(fineBalance)}
            hint="Pay early to avoid restrictions"
            icon={<ReceiptText className="w-3.5 h-3.5" />}
            variant={fineBalance > 500000 ? 'critical' : 'warning'}
          />
          <CustomerStatCard
            label="Wallet Balance"
            value={formatCurrencyVnd(walletBalance)}
            hint="Used for auto-debit borrow fee"
            icon={<Wallet className="w-3.5 h-3.5" />}
            variant={walletBalance < 100000 ? 'warning' : 'success'}
          />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard to="/customer/books" title="Browse Books" description="Find titles and reserve quickly." icon={BookOpen} />
        <QuickActionCard to="/customer/loans" title="Manage Loans" description="Track due dates and renewals." icon={HandCoins} />
        <QuickActionCard to="/customer/reservations" title="Reservations" description="Check pending and ready pickups." icon={CalendarClock} />
        <QuickActionCard to="/customer/notifications" title="Notifications" description="View reminders and updates." icon={Bell} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="Recent Loans" subtitle="Latest active or pending loan records" className="xl:col-span-2">
          {recentLoans.length === 0 ? (
            <CustomerStateBlock mode="empty" message="No recent loans yet." />
          ) : (
            <div className="space-y-2.5">
              {recentLoans.map((row) => (
                <LoanCard key={row.id} item={row} onView={(id) => navigate(`/customer/loans/${id}`)} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Membership" subtitle="Borrowing policy snapshot">
          <div className="space-y-2 text-[12px] text-slate-600">
            <div className="rounded-[10px] border border-slate-200 bg-white p-3">
              <p className="text-slate-500">Max active loans</p>
              <p className="mt-1 text-[14px] text-slate-900" style={{ fontWeight: 700 }}>{membership.limits.max_active_loans}</p>
            </div>
            <div className="rounded-[10px] border border-slate-200 bg-white p-3">
              <p className="text-slate-500">Max loan days</p>
              <p className="mt-1 text-[14px] text-slate-900" style={{ fontWeight: 700 }}>{membership.limits.max_loan_days} days</p>
            </div>
            <div className="rounded-[10px] border border-slate-200 bg-white p-3">
              <p className="text-slate-500">Fine per day</p>
              <p className="mt-1 text-[14px] text-slate-900" style={{ fontWeight: 700 }}>{membership.limits.fine_per_day}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Recent Reservations" subtitle="Track pending and ready items">
          {recentReservations.length === 0 ? (
            <CustomerStateBlock mode="empty" message="No reservations yet." />
          ) : (
            <div className="space-y-2.5">
              {recentReservations.map((row) => (
                <ReservationCard key={row.id} item={row} onCancel={() => navigate('/customer/reservations')} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Activity Highlights" subtitle="Latest account updates">
          {recentNotifications.length === 0 ? (
            <CustomerStateBlock mode="empty" message="No recent activity." />
          ) : (
            <ul className="space-y-2">
              {recentNotifications.map((row) => (
                <li key={row.id} className="rounded-[10px] border border-slate-200 bg-white p-3">
                  <p className="text-[12px] text-slate-900" style={{ fontWeight: 600 }}>{row.subject || row.template_code || 'Activity'}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{row.body || 'System update available.'}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="rounded-[14px] border border-cyan-200 bg-gradient-to-br from-cyan-50/80 to-white p-4 text-[13px] text-slate-600">
        <div className="flex items-center gap-2 text-slate-700" style={{ fontWeight: 600 }}>
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Quick note
        </div>
        <p className="mt-2">
          Keep your wallet funded and return items on time to avoid overdue fines. You can check upcoming due dates in My Loans.
        </p>
      </div>
    </div>
  );
}
