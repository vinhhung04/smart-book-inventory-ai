import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { BookMarked, Users, CalendarClock, CircleAlert, ArrowRight } from 'lucide-react';
import { PageWrapper, FadeItem } from '../motion-utils';
import { borrowService, type Customer, type Reservation, type Loan } from '@/services/borrow';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

export function BorrowPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [customerResp, reservationResp, loanResp] = await Promise.all([
        borrowService.getCustomers({ pageSize: 200 }),
        borrowService.getReservations({ pageSize: 200 }),
        borrowService.getLoans({ pageSize: 200 }),
      ]);
      setCustomers(customerResp.data || []);
      setReservations(reservationResp.data || []);
      setLoans(loanResp.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load borrow dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const activeCustomers = customers.filter((customer) => customer.status === 'ACTIVE').length;
    const pendingReservations = reservations.filter((reservation) => reservation.status === 'PENDING').length;
    const readyReservations = reservations.filter((reservation) => reservation.status === 'READY_FOR_PICKUP').length;
    const activeLoans = loans.filter((loan) => loan.status === 'BORROWED' || loan.status === 'OVERDUE' || loan.status === 'RESERVED').length;
    const totalFineBalance = customers.reduce((sum, customer) => sum + Number(customer.total_fine_balance || 0), 0);
    return {
      activeCustomers,
      pendingReservations,
      readyReservations,
      activeLoans,
      totalFineBalance,
    };
  }, [customers, reservations, loans]);

  return (
    <PageWrapper className="space-y-5">
      <FadeItem>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center border border-rose-200/40">
              <BookMarked className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="tracking-[-0.02em]">Borrow Management</h1>
              <p className="text-[12px] text-slate-400 mt-0.5">Realtime customer and reservation flow</p>
            </div>
          </div>
          <button
            onClick={() => void loadDashboard()}
            className="px-3.5 py-2 rounded-[10px] border border-slate-200 bg-white text-slate-600 text-[13px] hover:bg-slate-50"
            style={{ fontWeight: 550 }}
          >
            Refresh
          </button>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Active Customers', val: summary.activeCustomers, icon: Users, color: 'from-emerald-50 to-teal-50/50 border-emerald-100/60', textColor: 'text-emerald-700' },
            { label: 'Pending Reservations', val: summary.pendingReservations, icon: CalendarClock, color: 'from-amber-50 to-orange-50/50 border-amber-100/60', textColor: 'text-amber-700' },
            { label: 'Ready For Pickup', val: summary.readyReservations, icon: BookMarked, color: 'from-blue-50 to-cyan-50/50 border-blue-100/60', textColor: 'text-blue-700' },
            { label: 'Active Loans', val: summary.activeLoans, icon: BookMarked, color: 'from-teal-50 to-cyan-50/50 border-teal-100/60', textColor: 'text-teal-700' },
            { label: 'Fine Balance', val: `${summary.totalFineBalance.toLocaleString('vi-VN')} VND`, icon: CircleAlert, color: 'from-rose-50 to-red-50/50 border-rose-100/60', textColor: 'text-rose-700' },
          ].map((item) => (
            <motion.div key={item.label} whileHover={{ y: -2 }} className={`bg-gradient-to-br ${item.color} rounded-[12px] border p-3`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[11px] text-slate-500" style={{ fontWeight: 550 }}>{item.label}</p>
                <item.icon className="w-4 h-4 text-slate-400" />
              </div>
              <p className={`text-[22px] ${item.textColor}`} style={{ fontWeight: 700, lineHeight: 1 }}>{loading ? '-' : item.val}</p>
            </motion.div>
          ))}
        </div>
      </FadeItem>

      <FadeItem>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Link to="/borrow/customers" className="group bg-white rounded-[14px] border border-slate-200 p-4 hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] text-slate-700" style={{ fontWeight: 650 }}>Manage Customers</p>
                <p className="text-[12px] text-slate-400 mt-1">Create, update and review customer eligibility.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
          </Link>

          <Link to="/borrow/reservations" className="group bg-white rounded-[14px] border border-slate-200 p-4 hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] text-slate-700" style={{ fontWeight: 650 }}>Manage Reservations</p>
                <p className="text-[12px] text-slate-400 mt-1">Create, list and cancel reservations with real stock reserve.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
          </Link>

          <Link to="/borrow/loans" className="group bg-white rounded-[14px] border border-slate-200 p-4 hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] text-slate-700" style={{ fontWeight: 650 }}>Manage Loans</p>
                <p className="text-[12px] text-slate-400 mt-1">Convert reservation to loan and process return flow.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
          </Link>

          <Link to="/borrow/fines" className="group bg-white rounded-[14px] border border-slate-200 p-4 hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] text-slate-700" style={{ fontWeight: 650 }}>Manage Fines</p>
                <p className="text-[12px] text-slate-400 mt-1">View details, record payment, and waive/reduce fines.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
          </Link>
        </div>
      </FadeItem>
    </PageWrapper>
  );
}
