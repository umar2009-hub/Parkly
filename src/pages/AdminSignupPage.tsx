import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dbService } from '../services/dbAdapter';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, User, Mail, Phone, Lock, Eye, EyeOff, Key, CheckCircle } from 'lucide-react';

const QUOTES = [
  "Hmm, here we go...",
  "Ready to oversee the perfect spot?",
  "Your admin journey begins here.",
  "Let's get you set up.",
  "One less thing to worry about."
];

export const AdminSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setLoading(true);
      const { user, error } = await dbService.signupAdmin(
        fullName,
        email,
        phone,
        password,
        secretKey
      );

      // Clear the secret token from state
      setSecretKey('');

      if (error || !user) {
        showToast('The registration credentials are invalid.', 'error');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setSecretKey('');
      showToast('Unable to complete admin registration right now. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Visual background ambient details */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-lime/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto w-full max-w-md z-10 animate-slide-up">
        <div className="flex justify-center items-center space-x-2">
          <div className="bg-brand-lime/10 p-2.5 rounded-xl border border-brand-lime/30 text-brand-lime">
            <ShieldAlert size={26} />
          </div>
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            PARKLY <span className="text-brand-lime font-sans text-xs align-super border border-brand-lime/30 px-1 rounded bg-brand-lime/5">ADMIN</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-xl font-extrabold text-white">
          Secure Administrator Sign Up
        </h2>
        <div className="h-6 flex items-center justify-center mt-2">
           <p key={quoteIdx} className="text-center text-xs text-brand-text-muted animate-fade-in transition-opacity duration-500">
             {QUOTES[quoteIdx]}
           </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto w-full max-w-md z-10 px-4 sm:px-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-brand-surface border border-brand-surface-hover py-8 px-6 sm:px-10 shadow-2xl rounded-3xl space-y-6">
          {success ? (
            <div className="text-center space-y-6 animate-fade-in">
               <div className="flex justify-center">
                 <CheckCircle className="text-brand-lime w-16 h-16" />
               </div>
               <h3 className="text-white text-xl font-bold">Admin account created</h3>
               <p className="text-brand-text-muted text-sm">Welcome to Parkly Admin.</p>
               <Link
                 to="/admin"
                 className="w-full inline-block mt-4 bg-brand-lime hover:bg-brand-lime-hover text-black py-3 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] hover:scale-[1.02] active:scale-95"
               >
                 Go to Admin Dashboard
               </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
                  <input
                    type="text"
                    placeholder="Name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Predefined Admin Secret Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-lime uppercase tracking-wider block font-bold">Admin Secret Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={15} />
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder="Secret Token"
                    value={secretKey}
                    onChange={e => setSecretKey(e.target.value)}
                    autoComplete="off"
                    className="w-full bg-[#0F0F10] border border-brand-lime/20 focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white outline-none transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white transition-colors"
                    aria-label={showSecret ? 'Hide token' : 'Show token'}
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white outline-none transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={15} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating admin account...
                  </>
                ) : (
                  'Register Admin Account'
                )}
              </button>
            </form>
          )}

          {!success && (
            <div className="text-center pt-2 text-xs">
              <Link to="/login" className="text-brand-text-muted hover:text-brand-lime transition-colors">
                Return to standard Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
