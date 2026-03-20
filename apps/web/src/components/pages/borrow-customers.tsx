import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Search, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeItem } from '../motion-utils';
import { StatusBadge } from '../status-badge';
import { borrowService, type Customer, type CustomerPayload, type CustomerStatus } from '@/services/borrow';
import { getApiErrorMessage } from '@/services/api';

const customerStatuses: CustomerStatus[] = ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'INACTIVE'];

interface CustomerFormState {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  status: CustomerStatus;
}

const initialFormState: CustomerFormState = {
  full_name: '',
  email: '',
  phone: '',
  birth_date: '',
  address: '',
  status: 'ACTIVE',
};

function statusVariant(status: CustomerStatus) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED') return 'warning';
  if (status === 'BLOCKED') return 'danger';
  return 'neutral';
}

export function BorrowCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerStatus>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<CustomerFormState>(initialFormState);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await borrowService.getCustomers();
      setCustomers(response.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load customers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return customers.filter((customer) => {
      if (statusFilter !== 'ALL' && customer.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        customer.full_name.toLowerCase().includes(keyword)
        || customer.customer_code.toLowerCase().includes(keyword)
        || String(customer.email || '').toLowerCase().includes(keyword)
        || String(customer.phone || '').toLowerCase().includes(keyword)
      );
    });
  }, [customers, search, statusFilter]);

  const resetForm = () => {
    setFormState(initialFormState);
    setFormOpen(false);
  };

  const openEdit = (customer: Customer) => {
    setFormState({
      id: customer.id,
      full_name: customer.full_name,
      email: customer.email || '',
      phone: customer.phone || '',
      birth_date: customer.birth_date ? customer.birth_date.slice(0, 10) : '',
      address: customer.address || '',
      status: customer.status,
    });
    setFormOpen(true);
  };

  const onSave = async () => {
    if (formState.full_name.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }

    const payload: CustomerPayload = {
      full_name: formState.full_name.trim(),
      email: formState.email.trim() || undefined,
      phone: formState.phone.trim() || undefined,
      birth_date: formState.birth_date || undefined,
      address: formState.address.trim() || undefined,
      status: formState.status,
    };

    try {
      setSaving(true);
      if (formState.id) {
        await borrowService.updateCustomer(formState.id, payload);
        toast.success('Customer updated successfully');
      } else {
        await borrowService.createCustomer(payload);
        toast.success('Customer created successfully');
      }
      resetForm();
      await loadCustomers();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save customer'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper className="space-y-5">
      <FadeItem>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="tracking-[-0.02em]">Borrow Customers</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{customers.length} customers</p>
          </div>
          <button
            onClick={() => {
              setFormState(initialFormState);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[13px] shadow-md shadow-rose-500/15 hover:shadow-lg transition-all"
            style={{ fontWeight: 550 }}
          >
            <UserPlus className="w-4 h-4" /> New Customer
          </button>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose-100/60 rounded-[10px] text-[13px] outline-none focus:ring-[3px] focus:ring-rose-500/10 focus:border-rose-300/60 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200/60 rounded-[10px] p-[3px] shadow-sm">
            {(['ALL', ...customerStatuses] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`relative px-3.5 py-1.5 rounded-[8px] text-[12px] transition-all duration-160 ${statusFilter === status ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                style={{ fontWeight: 550 }}
              >
                {statusFilter === status && (
                  <motion.div
                    layoutId="customer-filter"
                    className="absolute inset-0 rounded-[8px] bg-gradient-to-r from-rose-600 to-pink-600 shadow-sm"
                    transition={{ duration: 0.22 }}
                  />
                )}
                <span className="relative z-10">{status}</span>
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
                {['Code', 'Name', 'Email', 'Phone', 'Status', 'Fine Balance', 'Action'].map((header) => (
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
                    <LoaderCircle className="w-4 h-4 inline mr-2 animate-spin" /> Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-[13px] text-slate-400">No customers found</td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-50 last:border-0 hover:bg-rose-50/20 transition-all">
                    <td className="px-5 py-3.5 text-[13px]" style={{ fontWeight: 550 }}>{customer.customer_code}</td>
                    <td className="px-5 py-3.5 text-[13px]">{customer.full_name}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{customer.email || '-'}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{customer.phone || '-'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={customer.status} variant={statusVariant(customer.status)} dot />
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-rose-700" style={{ fontWeight: 550 }}>
                      {Number(customer.total_fine_balance).toLocaleString('vi-VN')} VND
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(customer)}
                        className="px-2.5 py-1 rounded-[6px] border border-blue-200 bg-blue-50 text-blue-700 text-[11px] hover:bg-blue-100 transition-all"
                        style={{ fontWeight: 550 }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeItem>

      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-[16px] p-6 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-[16px] mb-4" style={{ fontWeight: 650 }}>{formState.id ? 'Edit Customer' : 'New Customer'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Full name*
                  <input
                    value={formState.full_name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, full_name: event.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                  />
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Status
                  <select
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as CustomerStatus }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                  >
                    {customerStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Email
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                  />
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Phone
                  <input
                    value={formState.phone}
                    onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                  />
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Birth date
                  <input
                    type="date"
                    value={formState.birth_date}
                    onChange={(event) => setFormState((prev) => ({ ...prev, birth_date: event.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                  />
                </label>
                <label className="text-[12px] text-slate-600 md:col-span-2" style={{ fontWeight: 550 }}>
                  Address
                  <textarea
                    value={formState.address}
                    onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                    rows={2}
                  />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-700 text-[13px] hover:bg-slate-50" style={{ fontWeight: 550 }}>
                  Cancel
                </button>
                <button
                  onClick={() => void onSave()}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[13px] shadow-md disabled:opacity-60"
                  style={{ fontWeight: 550 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
