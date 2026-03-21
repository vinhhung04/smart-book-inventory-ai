import { LucideIcon, Bell, BookOpen, CalendarClock, HandCoins, House, ReceiptText, ShieldCheck, User } from 'lucide-react';
import { NavLink } from 'react-router';

export interface CustomerSidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface CustomerSidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

const primaryItems: CustomerSidebarItem[] = [
  { to: '/customer', label: 'Dashboard', icon: House, end: true },
  { to: '/customer/books', label: 'Browse Books', icon: BookOpen },
  { to: '/customer/loans', label: 'My Loans', icon: HandCoins },
  { to: '/customer/reservations', label: 'My Reservations', icon: CalendarClock },
];

const accountItems: CustomerSidebarItem[] = [
  { to: '/customer/membership', label: 'My Membership', icon: ShieldCheck },
  { to: '/customer/fines', label: 'My Fines', icon: ReceiptText },
  { to: '/customer/notifications', label: 'My Notifications', icon: Bell },
  { to: '/customer/profile', label: 'My Profile', icon: User },
];

function NavSection({
  title,
  items,
  collapsed,
  onNavigate,
}: {
  title: string;
  items: CustomerSidebarItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      {!collapsed ? (
        <p className="px-2 text-[10px] uppercase tracking-[0.08em] text-slate-400">{title}</p>
      ) : null}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'group flex items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-[13px] transition-all duration-200',
              isActive
                ? 'border border-indigo-200/80 bg-gradient-to-r from-indigo-50 to-cyan-50 text-indigo-700 shadow-[0_4px_14px_rgba(79,70,229,0.12)]'
                : 'border border-transparent text-slate-600 hover:border-cyan-100 hover:bg-cyan-50/40 hover:text-slate-900',
              collapsed ? 'justify-center px-0' : '',
            ].join(' ')
          }
          title={collapsed ? item.label : undefined}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed ? <span style={{ fontWeight: 600 }}>{item.label}</span> : null}
        </NavLink>
      ))}
    </div>
  );
}

export function CustomerSidebar({ collapsed = false, onNavigate }: CustomerSidebarProps) {
  return (
    <aside
      className={[
        'h-full border-r border-slate-200 bg-white/95 px-3 py-4 backdrop-blur',
        collapsed ? 'w-[84px]' : 'w-[264px]',
      ].join(' ')}
    >
      <div className="flex h-full flex-col">
        <div className={['mb-6 flex items-center gap-2', collapsed ? 'justify-center' : ''].join(' ')}>
          <div className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-[0_8px_18px_rgba(99,102,241,0.35)]" />
          {!collapsed ? (
            <div>
              <p className="text-[14px] text-indigo-700" style={{ fontWeight: 700 }}>
                SmartBook
              </p>
              <p className="text-[11px] text-slate-500">Customer Portal</p>
            </div>
          ) : null}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto">
          <NavSection title="Main" items={primaryItems} collapsed={collapsed} onNavigate={onNavigate} />
          <NavSection title="Account" items={accountItems} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      </div>
    </aside>
  );
}
