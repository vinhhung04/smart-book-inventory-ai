import { useEffect, useState } from 'react';
import { customerService, CustomerProfile } from '@/services/customer';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

export function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', birth_date: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await customerService.getMyProfile();
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          birth_date: data.birth_date ? String(data.birth_date).slice(0, 10) : '',
          address: data.address || '',
        });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load profile'));
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await customerService.updateMyProfile({
        full_name: form.full_name,
        phone: form.phone || null,
        birth_date: form.birth_date || null,
        address: form.address || null,
      });
      setProfile(updated);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>;
  }

  if (!profile) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Customer profile not found.</div>;
  }

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-6 max-w-3xl">
      <div className="mb-5">
        <h2 className="text-[20px] tracking-[-0.02em]" style={{ fontWeight: 700 }}>My Profile</h2>
        <p className="text-[12px] text-slate-500 mt-1">Customer code: {profile.customer_code}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-[12px] text-slate-600 mb-1.5">Email</label>
          <input value={profile.email || ''} disabled className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 bg-slate-50 text-[13px] text-slate-500" />
        </div>
        <div>
          <label className="block text-[12px] text-slate-600 mb-1.5">Full name</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 bg-white text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
        </div>
        <div>
          <label className="block text-[12px] text-slate-600 mb-1.5">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 bg-white text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
        </div>
        <div>
          <label className="block text-[12px] text-slate-600 mb-1.5">Birth date</label>
          <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 bg-white text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[12px] text-slate-600 mb-1.5">Address</label>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 bg-white text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button onClick={() => void handleSave()} disabled={isSaving} className="px-4 py-2.5 rounded-[10px] bg-indigo-600 text-white text-[13px] disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
