import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router';
import { authService } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.username || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.register(form);
      toast.success('Registration successful. Please sign in.');
      navigate('/customer/login');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Register failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5fa] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-[24px] tracking-[-0.02em]" style={{ fontWeight: 700 }}>Customer Registration</h1>
        <p className="text-[13px] text-slate-500 mt-1 mb-5">Create your customer account for SmartBook.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] text-slate-600 mb-1.5">Full name</label>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
          </div>
          <div>
            <label className="block text-[12px] text-slate-600 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
          </div>
          <div>
            <label className="block text-[12px] text-slate-600 mb-1.5">Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
          </div>
          <div>
            <label className="block text-[12px] text-slate-600 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
          </div>
        </div>

        <button onClick={() => void handleSubmit()} disabled={isSubmitting} className="w-full mt-5 py-2.5 rounded-[10px] bg-indigo-600 text-white text-[13px] disabled:opacity-60">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

        <div className="text-center mt-4 text-[12px] text-slate-600">
          Already registered? <NavLink to="/customer/login" className="text-indigo-600 hover:text-indigo-800" style={{ fontWeight: 600 }}>Sign in</NavLink>
        </div>
      </div>
    </div>
  );
}
