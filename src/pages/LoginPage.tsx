import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const QUOTES = [
  "Hmm, here we go...",
  "Ready to find the perfect spot?",
  "Your parking journey begins here.",
  "Let's get you parked.",
  "One less thing to worry about."
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Retrieve origin route from ProtectedRoute redirect
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-brand-charcoal text-white flex flex-col justify-center items-center px-6 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-lime/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main card */}
      <div className="max-w-md w-full bg-brand-surface border border-brand-surface-hover rounded-2xl p-8 shadow-2xl relative z-10 animate-slide-up">
        
        {/* Title */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-lg">P</div>
            <span className="text-xl font-bold tracking-tight text-white">Parkly</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight animate-fade-in">Welcome back</h2>
          <div className="h-5 mt-1.5 flex items-center justify-center">
            <p key={quoteIdx} className="text-xs text-brand-text-muted animate-fade-in transition-opacity duration-500">
              {QUOTES[quoteIdx]}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-brand-text-muted block uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all font-sans"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-brand-text-muted block uppercase tracking-wider">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-all font-mono"
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
            <label htmlFor="remember" className="text-[10px] font-mono text-brand-text-muted select-none">Remember this device</label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(132,204,22,0.1)] hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                 <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                 <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-brand-surface-hover flex flex-col items-center space-y-4">
          <p className="text-xs text-brand-text-muted text-center">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:text-brand-lime hover:underline transition-colors">Create one</Link>
          </p>

          <Link 
            to="/admin/signup" 
            className="text-[10px] font-mono text-brand-text-muted/60 hover:text-brand-text-muted transition-colors"
          >
            Admin? Register securely
          </Link>
        </div>

      </div>
    </div>
  );
};
