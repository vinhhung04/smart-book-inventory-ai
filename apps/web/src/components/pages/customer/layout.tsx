import { Outlet, NavLink, useNavigate } from 'react-router';
import { User, LogOut, House, ShieldCheck, BookOpen, CalendarClock, HandCoins, Bell, ReceiptText } from 'lucide-react';
import { authService } from '@/services/auth';
import { toast } from 'sonner';

export function CustomerLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logged out');
    navigate('/customer/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <header className="sticky top-0 z-10 h-[56px] bg-white/95 backdrop-blur border-b border-[#e2e4ed] px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600" />
          <span className="text-[15px] tracking-[-0.02em] text-indigo-700" style={{ fontWeight: 700 }}>SmartBook Customer</span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-slate-600">
          <span className="hidden sm:inline">{user?.full_name || user?.username}</span>
          <button onClick={() => void handleLogout()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-slate-200 hover:bg-slate-50 text-slate-700">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <nav className="flex flex-wrap items-center gap-2 mb-5">
          <NavLink to="/customer" end className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <House className="w-3.5 h-3.5" />
            Dashboard
          </NavLink>
          <NavLink to="/customer/profile" className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <User className="w-3.5 h-3.5" />
            My Profile
          </NavLink>
          <NavLink to="/customer/books" className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <BookOpen className="w-3.5 h-3.5" />
            Browse Books
          </NavLink>
          <NavLink to="/customer/membership" className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            My Membership
          </NavLink>
          <NavLink to="/customer/reservations" className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <CalendarClock className="w-3.5 h-3.5" />
            My Reservations
          </NavLink>
          <NavLink to="/customer/loans" className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <HandCoins className="w-3.5 h-3.5" />
            My Loans
          </NavLink>
          <NavLink to="/customer/fines" className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <ReceiptText className="w-3.5 h-3.5" />
            My Fines
          </NavLink>
          <NavLink to="/customer/notifications" className={({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Bell className="w-3.5 h-3.5" />
            My Notifications
          </NavLink>
        </nav>

        <Outlet />
      </div>
    </div>
  );
}
