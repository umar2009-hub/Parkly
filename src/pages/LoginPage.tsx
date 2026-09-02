import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Mail, Lock, Eye, EyeOff, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Retrieve origin route from ProtectedRoute redirect
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const { success, error } = await login(email, password);
      if (success) {
        showToast('Successfully logged in! Welcome back.', 'success');
        
        // Fetch session user role to route them correctly if they logged in generally
        setTimeout(async () => {
          const { dbService } = await import('../services/dbAdapter');
          const profile = await dbService.getSessionUser();
          if (profile) {
            if (from !== '/') {
              navigate(from, { replace: true });
            } else {
              if (profile.role === 'ADMIN') navigate('/admin', { replace: true });
              else if (profile.role === 'OWNER') navigate('/owner', { replace: true });
              else navigate('/app', { replace: true });
            }
          }
        }, 100);
      } else {
        showToast(error || 'Invalid credentials.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Demo user one-click login helper
  const handleQuickLogin = async (roleEmail: string) => {
    try {
      setSubmitting(true);
      const { success, error } = await login(roleEmail, 'password');
      if (success) {
        showToast(`Logged in successfully as demo profile!`, 'success');
        if (roleEmail.includes('admin')) navigate('/admin', { replace: true });
        else if (roleEmail.includes('owner')) navigate('/owner', { replace: true });
        else navigate('/app', { replace: true });
      } else {
        showToast(error || 'Demo login failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Demo login failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal text-white flex flex-col justify-center items-center px-6 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-lime/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main card */}
      <div className="max-w-md w-full bg-brand-surface border border-brand-surface-hover rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in">
        
        {/* Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-lg">P</div>
            <span className="text-xl font-bold tracking-tight text-white">Parkly</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-xs text-brand-text-muted mt-1.5">Sign in to your smart parking dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-text-muted block uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
              <input
                type="email"
                placeholder="driver@parkly.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all font-sans"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-brand-text-muted block uppercase tracking-wider">Password</label>
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Demo passwords are set to "password"', 'info'); }} className="text-xs text-brand-lime hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime mr-2 h-4 w-4"
              defaultChecked
            />
            <label htmlFor="remember" className="text-xs text-brand-text-muted select-none">Remember this device</label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(132,204,22,0.1)] focus:ring-2 focus:ring-brand-lime flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="text-xs text-brand-text-muted text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-lime hover:underline font-semibold">Sign up</Link>
        </p>

        {/* Demo Fast Login Shortcuts Panel */}
        <div className="mt-8 pt-6 border-t border-brand-surface-hover space-y-3">
          <div className="flex items-center space-x-2 text-brand-lime">
            <UserCheck size={14} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Demo Quick Access Login</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('driver@parkly.com')}
              className="bg-brand-surface-hover hover:border-brand-lime/40 border border-brand-surface text-[10px] font-semibold py-2 rounded transition-all flex flex-col items-center justify-center space-y-0.5"
            >
              <span className="text-white">Driver</span>
              <span className="text-[8px] text-brand-text-muted font-mono">Rahul</span>
            </button>
            <button
              onClick={() => handleQuickLogin('owner@parkly.com')}
              className="bg-brand-surface-hover hover:border-brand-lime/40 border border-brand-surface text-[10px] font-semibold py-2 rounded transition-all flex flex-col items-center justify-center space-y-0.5"
            >
              <span className="text-white">Owner</span>
              <span className="text-[8px] text-brand-text-muted font-mono">Ananya</span>
            </button>
            <button
              onClick={() => handleQuickLogin('admin@parkly.com')}
              className="bg-brand-surface-hover hover:border-brand-lime/40 border border-brand-surface text-[10px] font-semibold py-2 rounded transition-all flex flex-col items-center justify-center space-y-0.5"
            >
              <span className="text-white">Admin</span>
              <span className="text-[8px] text-brand-text-muted font-mono">Vikram</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
