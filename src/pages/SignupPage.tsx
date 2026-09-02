import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';

const QUOTES = [
  "Hmm, here we go...",
  "Ready to find the perfect spot?",
  "Your parking journey begins here.",
  "Let's get you parked.",
  "One less thing to worry about."
];

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('DRIVER');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Set default role if present in search params (e.g. ?role=OWNER)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'OWNER') {
      setRole('OWNER');
    }
  }, [searchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const { success, error } = await signup(fullName, email, phone, password, role);

      if (success) {
        showToast('Registration successful! Welcome to Parkly.', 'success');
        setTimeout(() => {
          if (role === 'OWNER') navigate('/owner');
          else navigate('/app');
        }, 1000);
      } else {
        showToast(error || 'Signup failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Signup failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal text-white flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-lime/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-brand-surface border border-brand-surface-hover rounded-2xl p-8 shadow-2xl relative z-10 animate-slide-up">
        
        {/* Title */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-lg">P</div>
            <span className="text-xl font-bold tracking-tight text-white">Parkly</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight animate-fade-in">Create your account</h2>
          <div className="h-5 mt-1.5 flex items-center justify-center">
            <p key={quoteIdx} className="text-xs text-brand-text-muted animate-fade-in transition-opacity duration-500">
              {QUOTES[quoteIdx]}
            </p>
          </div>
        </div>

        {/* Role Selector Button Grid */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-[#0F0F10] p-1.5 rounded-lg border border-brand-surface-hover animate-fade-in" style={{ animationDelay: '100ms' }}>
          <button
            type="button"
            onClick={() => setRole('DRIVER')}
            className={`py-2 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all ${
              role === 'DRIVER' 
                ? 'bg-brand-lime text-black font-bold shadow-sm' 
                : 'text-brand-text-muted hover:text-white hover:bg-brand-surface-hover'
            }`}
          >
            Driver
          </button>
          <button
            type="button"
            onClick={() => setRole('OWNER')}
            className={`py-2 rounded-md text-[10px] font-semibold tracking-wider uppercase transition-all ${
              role === 'OWNER' 
                ? 'bg-brand-lime text-black font-bold shadow-sm' 
                : 'text-brand-text-muted hover:text-white hover:bg-brand-surface-hover'
            }`}
          >
            Parking Owner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted block uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
              <input
                type="text"
                placeholder="Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted block uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted block uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
              <input
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted block uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-lg pl-9 pr-10 py-2 text-sm outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted block uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-lg pl-9 pr-10 py-2 text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 mt-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(132,204,22,0.1)] hover:scale-[1.02] active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                 <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                 <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="text-xs text-brand-text-muted text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-lime hover:underline font-semibold">Sign in</Link>
        </p>

      </div>
    </div>
  );
};
