import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { Profile, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Users, Search, ShieldAlert, CheckCircle, 
  Trash2, RefreshCw, Star, Ban, Award, Eye 
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await dbService.getUsersAdmin();
      setProfiles(data);
    } catch (err: any) {
      showToast('Error loading profiles database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleToggleSuspension = async (profile: Profile, suspend: boolean) => {
    if (profile.id === currentAdmin?.id) {
      showToast('You cannot suspend your own administrative session.', 'error');
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to ${suspend ? 'suspend' : 'reactivate'} the account of ${profile.full_name} (${profile.email})?`
    );
    if (!confirm) return;

    try {
      await dbService.toggleUserSuspension(profile.id, suspend);
      showToast(`User account ${suspend ? 'suspended' : 'reactivated'} successfully.`, 'success');
      loadProfiles();
    } catch (err: any) {
      showToast('Failed to modify account suspension state.', 'error');
    }
  };

  // Filter pipeline
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.phone.includes(searchQuery);
    
    const matchesRole = roleFilter === 'ALL' ? true : p.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">User Administration</h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">Search user profiles, manage operators permits, toggle accounts suspensions</p>
        </div>
        <button onClick={loadProfiles}><RefreshCw size={14} className="text-brand-text-muted hover:text-white" /></button>
      </div>

      {/* Filters search bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-brand-text-muted">
          <span>Role Filter:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-brand-surface border border-brand-surface-hover rounded-lg px-3 py-1.5 text-xs outline-none font-bold text-white focus:border-brand-lime"
          >
            <option value="ALL">All Roles</option>
            <option value="DRIVER">Drivers</option>
            <option value="OWNER">Owners</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="border-b border-brand-surface-hover/30 skeleton-shimmer h-12 mb-2"></div>
            ))
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-brand-surface-hover text-brand-text-muted uppercase text-[10px] font-mono">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Phone</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Joined</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map(profile => (
                  <tr 
                    key={profile.id}
                    className="border-b border-brand-surface-hover/50 text-brand-text-muted hover:text-white transition-colors"
                  >
                    <td className="py-3 flex items-center space-x-3">
                      <img 
                        src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        alt={profile.full_name} 
                        className="w-8 h-8 rounded-full border border-brand-surface-hover object-cover"
                      />
                      <span className="font-bold text-white">{profile.full_name}</span>
                    </td>
                    <td className="py-3 font-mono">{profile.email}</td>
                    <td className="py-3 font-mono">{profile.phone}</td>
                    <td className="py-3">
                      <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded font-bold ${
                        profile.role === 'ADMIN' ? 'bg-error/15 border-error/20 text-error' : profile.role === 'OWNER' ? 'bg-info/15 border-info/20 text-info' : 'bg-brand-lime/10 border-brand-lime/20 text-brand-lime'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="py-3">{new Date(profile.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      {profile.id !== currentAdmin?.id && (
                        <button
                          onClick={() => handleToggleSuspension(profile, !profile.is_suspended)}
                          className={`border px-2 py-1 rounded text-[10px] transition-colors ${
                            profile.is_suspended
                              ? 'bg-success/15 border-success/20 text-success hover:bg-success/25'
                              : 'bg-brand-charcoal hover:bg-error/10 border-brand-surface-hover hover:border-error/30 text-brand-text-muted hover:text-error'
                          }`}
                        >
                          {profile.is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-brand-text-muted">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
