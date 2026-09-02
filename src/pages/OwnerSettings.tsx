import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Settings, Lock, Eye, EyeOff, Bell, Moon } from 'lucide-react';

export const OwnerSettings: React.FC = () => {
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPassword(true);
    setTimeout(() => {
      showToast('Password changed successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
      setSubmittingPassword(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Owner Settings</h1>
        <p className="text-xs text-brand-text-muted mt-1">Manage credentials, payout bank listings, and platform warning rules</p>
      </div>

      <div className="space-y-6">
        
        {/* Passwords change */}
        <form onSubmit={handlePasswordChange} className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
            <Lock size={16} />
            <span>Update Password</span>
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

        {/* System Settings Toggles */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
            <Bell size={16} />
            <span>Alert Preferences</span>
          </h3>

          <div className="space-y-3.5 text-xs text-brand-text-muted">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">Occupancy thresholds alarms</span>
                <span className="text-[10px]">Notify me when slots occupancy climbs above 80% to configure dynamic adjustments.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime h-4 w-4" />
            </div>

            <div className="flex justify-between items-center border-t border-brand-surface-hover/50 pt-3">
              <div>
                <span className="font-bold text-white block">Email Statement logs</span>
                <span className="text-[10px]">Send daily transaction payout summaries directly to my email box.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime h-4 w-4" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
