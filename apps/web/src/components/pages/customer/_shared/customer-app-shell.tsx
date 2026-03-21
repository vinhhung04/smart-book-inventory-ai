import { ReactNode, useState } from 'react';
import { CustomerSidebar } from './customer-sidebar';
import { CustomerHeader } from './customer-header';

interface CustomerAppShellProps {
  children: ReactNode;
}

export function CustomerAppShell({ children }: CustomerAppShellProps) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5fa] bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_42%),radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_38%)]">
      <div className="flex min-h-screen">
        <div className={[ 'hidden lg:block', isDesktopCollapsed ? 'w-[84px]' : 'w-[264px]' ].join(' ')}>
          <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
            <CustomerSidebar collapsed={isDesktopCollapsed} />
          </div>
        </div>

        {isMobileOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setIsMobileOpen(false)}>
            <div className="h-full w-[272px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <CustomerSidebar onNavigate={() => setIsMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <CustomerHeader
            onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
            onToggleDesktopCollapse={() => setIsDesktopCollapsed((prev) => !prev)}
            isDesktopCollapsed={isDesktopCollapsed}
          />
          <main className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
