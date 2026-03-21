import { Outlet } from 'react-router';
import { CustomerAppShell } from './_shared/customer-app-shell';

export function CustomerLayout() {
  return (
    <CustomerAppShell>
      <Outlet />
    </CustomerAppShell>
  );
}
