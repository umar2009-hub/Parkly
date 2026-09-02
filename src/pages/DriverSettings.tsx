import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Settings, Lock, Eye, EyeOff, Bell, Moon, Globe, Trash2 } from 'lucide-react';

export const DriverSettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // App Toggles
  const [themeMode, setThemeMode] = useState('dark');
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('Please specify passwords.', 'warning');
      return;
    }

    setSubmittingPassword(true);
    setTimeout(() => {
      showToast('Password changed successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
      setSubmittingPassword(false);
    }, 1200);
  };

  const handleDeleteAccount = () => {
    const doubleCheck = window.confirm('Are you absolutely sure you want to delete your account? This is irreversible.');
    if (doubleCheck) {
      showToast('Account deletion simulated. All session keys purged.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-2xl">
      
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-xs text-brand-text-muted mt-1">Manage system configurations, push notification channels and credentials</p>
      </div>

      <div className="space-y-6">
        
        {/* Change password */}
        <form onSubmit={handlePasswordChange} className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
            <Lock size={16} />
            <span>Change Password</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="password"
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingPassword}
            className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center justify-center"
          >
            {submittingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Notifications config */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
            <Bell size={16} />
            <span>Notification Settings</span>
          </h3>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white block">Booking confirmations</span>
                <span className="text-[10px] text-brand-text-muted">Receive details instantly when a slot checkin/out processes.</span>
              </div>
              <input
                type="checkbox"
                checked={notifBooking}
                onChange={e => setNotifBooking(e.target.checked)}
                className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime h-4 w-4"
              />
            </div>

            <div className="flex justify-between items-center text-xs border-t border-brand-surface-hover/50 pt-3">
              <div>
                <span className="font-bold text-white block">Hourly Reminders</span>
                <span className="text-[10px] text-brand-text-muted">Notify me 15 minutes before stay time limits are reaching.</span>
              </div>
              <input
                type="checkbox"
                checked={notifReminder}
                onChange={e => setNotifReminder(e.target.checked)}
                className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime h-4 w-4"
              />
            </div>

            <div className="flex justify-between items-center text-xs border-t border-brand-surface-hover/50 pt-3">
              <div>
                <span className="font-bold text-white block">SaaS promotional discounts</span>
                <span className="text-[10px] text-brand-text-muted">Receive periodic credits and peak pricing adjustments forecasts.</span>
              </div>
              <input
                type="checkbox"
                checked={notifMarketing}
                onChange={e => setNotifMarketing(e.target.checked)}
                className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime h-4 w-4"
              />
            </div>
          </div>
        </div>

        {/* Global theme config & deletion */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
            <Settings size={16} />
            <span>Preferences & Danger Zone</span>
          </h3>

          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <div className="bg-brand-charcoal p-2 rounded-lg border border-brand-surface-hover text-brand-lime">
                <Moon size={16} />
              </div>
              <div>
                <span className="font-bold block text-white">Visual Mode: Dark Theme</span>
                <span className="text-[9px] text-brand-text-muted">Dark Mode is optimized to save battery on OLED mobile displays.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="bg-brand-charcoal hover:bg-error/10 border border-brand-surface-hover hover:border-error/30 text-brand-text-muted hover:text-error px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 self-center"
            >
              <Trash2 size={13} />
              <span>Deactivate Account</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
