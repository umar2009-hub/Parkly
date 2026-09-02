import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbService } from '../services/dbAdapter';
import { Notification } from '../types';
import { 
  Users, Building2, Calendar, ClipboardList, ShieldAlert, 
  History, Settings, LogOut, Bell, Menu, X, ChevronRight, CheckSquare, LayoutDashboard, Trash2 
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const loadNotifications = async () => {
    if (user) {
      const data = await dbService.getNotifications(user.id);
      setNotifications(data);
    }
  };

  useEffect(() => {
    loadNotifications();
    const handleNewNotif = () => loadNotifications();
    window.addEventListener('notification_created', handleNewNotif);
    return () => window.removeEventListener('notification_created', handleNewNotif);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully.', 'info');
    navigate('/', { replace: true });
  };

  const markAllAsRead = async () => {
    if (user) {
      await dbService.markAllNotificationsRead(user.id);
      loadNotifications();
      showToast('All notifications marked as read.', 'success');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Parking Approvals', path: '/admin/parking', icon: Building2 },
    { name: 'Bookings Queue', path: '/admin/bookings', icon: Calendar },
    { name: 'Complaints', path: '/admin/complaints', icon: ShieldAlert },
    { name: 'Audit Logs', path: '/admin/audit', icon: ClipboardList },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-sans flex flex-col md:flex-row relative">
      
      {/* ==========================================
          DESKTOP SIDEBAR
         ========================================== */}
      <aside className="hidden md:flex md:w-64 bg-brand-surface border-r border-brand-surface-hover flex-col shrink-0">
        <div className="p-6 border-b border-brand-surface-hover flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-lg">P</div>
          <span className="text-xl font-bold tracking-tight">Parkly</span>
          <span className="text-[9px] bg-brand-lime/10 text-brand-lime border border-brand-lime/20 px-1 rounded font-mono uppercase tracking-wider">Admin</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group
                ${isActive 
                  ? 'bg-brand-lime text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.15)]' 
                  : 'text-brand-text-muted hover:text-white hover:bg-brand-surface-hover'
                }
              `}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="flex-1">{item.name}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-surface-hover space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.full_name}</p>
              <p className="text-[10px] text-brand-text-muted truncate font-mono">{user?.email}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="w-full border border-brand-surface-hover hover:border-error/40 hover:text-error text-brand-text-muted flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          MOBILE TOP-BAR
         ========================================== */}
      <header className="md:hidden sticky top-0 left-0 right-0 z-40 bg-brand-surface/90 backdrop-blur-md border-b border-brand-surface-hover px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-base">P</div>
          <span className="text-lg font-bold tracking-tight">Parkly</span>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            className="relative p-1 text-brand-text-muted hover:text-white transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-lime text-black font-mono font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-brand-surface">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-brand-text-muted hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ==========================================
          MOBILE NAVIGATION SLIDE-IN
         ========================================== */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)}>
          <div 
            className="absolute top-0 right-0 bottom-0 w-64 bg-brand-surface p-6 flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-brand-surface-hover">
                <span className="text-sm font-mono text-brand-lime font-bold">NAVIGATION</span>
                <button onClick={() => setSidebarOpen(false)}><X size={18} /></button>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
                      ${isActive 
                        ? 'bg-brand-lime text-black font-bold' 
                        : 'text-brand-text-muted hover:text-white hover:bg-brand-surface-hover'
                      }
                    `}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="space-y-4 pt-6 border-t border-brand-surface-hover">
              <div className="flex items-center space-x-3">
                <img 
                  src={user?.avatar_url} 
                  alt={user?.full_name} 
                  className="w-10 h-10 rounded-full border border-brand-surface-hover object-cover"
                />
                <div>
                  <p className="text-xs font-bold">{user?.full_name}</p>
                  <p className="text-[9px] text-brand-text-muted truncate font-mono">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full bg-brand-surface-hover text-brand-text-muted hover:text-error py-2 rounded-lg text-xs font-bold transition-all border border-brand-surface-hover"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MAIN AREA & CONTENT OUTLET
         ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-brand-charcoal min-h-screen pb-16 md:pb-0">
        
        {/* Desktop Header */}
        <header className="hidden md:flex bg-brand-surface/40 border-b border-brand-surface-hover px-8 py-4 justify-between items-center">
          <h2 className="text-sm font-mono text-brand-text-muted uppercase tracking-wider">
            {location.pathname.split('/').slice(2).join(' / ') || 'Dashboard'}
          </h2>
          
          <div className="flex items-center space-x-4 relative">
            <button 
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="p-2 text-brand-text-muted hover:text-white hover:bg-brand-surface-hover rounded-lg transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-lime text-black font-mono font-bold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-brand-surface">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div 
                className="absolute right-0 top-12 w-80 bg-brand-surface border border-brand-surface-hover rounded-xl shadow-2xl z-50 p-4 space-y-3 animate-slide-up"
                onMouseLeave={() => setShowNotificationsDropdown(false)}
              >
                <div className="flex justify-between items-center border-b border-brand-surface-hover pb-2">
                  <span className="text-xs font-mono font-bold text-brand-lime">NOTIFICATIONS</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-[10px] text-brand-lime hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-brand-text-muted text-center py-6">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all relative ${
                          n.is_read 
                            ? 'bg-brand-surface/30 border-brand-surface-hover text-brand-text-muted' 
                            : 'bg-brand-surface-hover/60 border-brand-lime/10 text-white'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            n.type === 'SUCCESS' ? 'bg-success' : n.type === 'WARNING' ? 'bg-warning' : n.type === 'ALERT' ? 'bg-error' : 'bg-info'
                          }`}></span>
                        </div>
                        <p className="text-[11px] mt-0.5 text-brand-text-muted">{n.message}</p>
                        <span className="text-[9px] font-mono text-brand-text-muted/60 block mt-1.5">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {!n.is_read && (
                            <button
                              onClick={async () => {
                                await dbService.markNotificationRead(n.id);
                                loadNotifications();
                              }}
                              className="text-brand-text-muted hover:text-brand-lime text-[10px] p-1"
                              title="Mark read"
                            >
                              <CheckSquare size={12} />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              await dbService.deleteNotification(n.id);
                              loadNotifications();
                            }}
                            className="text-brand-text-muted hover:text-error text-[10px] p-1"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="h-6 w-px bg-brand-surface-hover"></div>
            
            <div className="text-xs text-right">
              <p className="font-bold text-white leading-none">{user?.full_name}</p>
              <p className="text-[10px] text-brand-text-muted mt-0.5 font-mono">{user?.role}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ==========================================
          MOBILE BOTTOM NAVIGATION (Admin version)
         ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-surface border-t border-brand-surface-hover grid grid-cols-5 py-2">
        {[
          { name: 'Home', path: '/admin', icon: LayoutDashboard, exact: true },
          { name: 'Parking', path: '/admin/parking', icon: Building2 },
          { name: 'Users', path: '/admin/users', icon: Users },
          { name: 'Complaints', path: '/admin/complaints', icon: ShieldAlert },
          { name: 'Audits', path: '/admin/audit', icon: ClipboardList }
        ].map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `
              flex flex-col items-center justify-center text-[10px] font-semibold transition-all py-1
              ${isActive ? 'text-brand-lime font-bold' : 'text-brand-text-muted hover:text-white'}
            `}
          >
            <item.icon size={18} className="mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
};
