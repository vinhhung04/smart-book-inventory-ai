import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router';
import { authService } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!identifier || !password) {
      toast.error('Please provide account and password');
      return;
    }

    try {
      setIsSubmitting(true);
      const loginData = await authService.login({ identifier, password });
      if (!loginData.user?.roles?.includes('CUSTOMER')) {
        toast.error('This account is not a customer account');
        await authService.logout();
        return;
      }
      toast.success('Login successful');
      navigate('/customer');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5fa] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-[24px] tracking-[-0.02em]" style={{ fontWeight: 700 }}>Customer Sign In</h1>
        <p className="text-[13px] text-slate-500 mt-1 mb-5">Access your SmartBook customer portal.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] text-slate-600 mb-1.5">Email or Username</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
          </div>
          <div>
            <label className="block text-[12px] text-slate-600 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
          </div>
        </div>

        <button onClick={() => void handleSubmit()} disabled={isSubmitting} className="w-full mt-5 py-2.5 rounded-[10px] bg-indigo-600 text-white text-[13px] disabled:opacity-60">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="text-center mt-4 text-[12px] text-slate-600">
          Need an account? <NavLink to="/customer/register" className="text-indigo-600 hover:text-indigo-800" style={{ fontWeight: 600 }}>Register</NavLink>
        </div>
      </div>
    </div>
  );
}
