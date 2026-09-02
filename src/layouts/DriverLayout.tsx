import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbService, triggerRealtimeEvent } from '../services/dbAdapter';
import { Notification, Booking } from '../types';
import { 
  LayoutDashboard, Search, Calendar, History, Heart, 
  User, Settings, LogOut, Bell, Menu, X, ChevronRight, CheckSquare,
  CheckCircle, RefreshCcw, Trash2, ArrowLeft
} from 'lucide-react';

export const DriverLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  
  // Real-time Checkout States
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (user) {
      const data = await dbService.getNotifications(user.id);
      setNotifications(data);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Simulate real-time notifications on local mode
    const handleNewNotif = () => loadNotifications();
    window.addEventListener('notification_created', handleNewNotif);
    
    // Listen for checkout payment requests
    const handleCheckoutReq = (e: any) => {
      const booking = e.detail;
      if (booking && user && booking.user_id === user.id) {
        setCheckoutBooking(booking);
        setCheckoutSuccess(false);
      }
    };
    window.addEventListener('checkout_payment_requested', handleCheckoutReq);
    
    return () => {
      window.removeEventListener('notification_created', handleNewNotif);
      window.removeEventListener('checkout_payment_requested', handleCheckoutReq);
    };
  }, [user]);

  const handleCheckoutPayment = async () => {
    if (!checkoutBooking) return;
    setProcessingCheckout(true);
    try {
      const updated = await dbService.payWalkinFinalAmount(checkoutBooking.id, 'Wallet Balance');
      triggerRealtimeEvent('checkout_payment_completed', updated);
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutBooking(null);
        navigate('/app/history', { replace: true });
      }, 3000); // hide after 3 seconds and redirect
    } catch (err: any) {
      showToast('Payment failed.', 'error');
    } finally {
      setProcessingCheckout(false);
    }
  };

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
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard, exact: true },
    { name: 'Find Parking', path: '/app/find', icon: Search },
    { name: 'My Bookings', path: '/app/bookings', icon: Calendar },
    { name: 'History', path: '/app/history', icon: History },
    { name: 'Favorites', path: '/app/favorites', icon: Heart },
    { name: 'Profile', path: '/app/profile', icon: User },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-sans flex flex-col md:flex-row relative">
      
      {/* ==========================================
          DESKTOP SIDEBAR (Visible md+)
         ========================================== */}
      <aside className="hidden md:flex md:w-64 bg-brand-surface border-r border-brand-surface-hover flex-col shrink-0">
        {/* Brand Banner */}
        <div className="p-6 border-b border-brand-surface-hover flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-lg">P</div>
          <span className="text-xl font-bold tracking-tight">Parkly</span>
          <span className="text-[9px] bg-brand-lime/10 text-brand-lime border border-brand-lime/20 px-1 rounded font-mono uppercase tracking-wider">Driver</span>
        </div>

        {/* Navigation Items */}
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

        {/* User profile footer */}
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
          MOBILE STICKY TOP-BAR (Visible on mobile)
         ========================================== */}
      <header className="md:hidden sticky top-0 left-0 right-0 z-40 bg-brand-surface/90 backdrop-blur-md border-b border-brand-surface-hover px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-base">P</div>
          <span className="text-lg font-bold tracking-tight">Parkly</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications Trigger */}
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
          MOBILE SIDEBAR OVERLAY
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
          NOTIFICATIONS DROPDOWN MODAL (Desktop right side overlay)
         ========================================== */}
      <div className="absolute top-4 right-16 z-50">
        {/* Toggle notifications trigger on desktop top header if needed */}
      </div>

      {/* ==========================================
          MAIN AREA & STICKY HEADER FOR DESKTOP
         ========================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-brand-charcoal min-h-screen pb-16 md:pb-0 relative">
        
        {/* Desktop Header */}
        <header className="hidden md:flex bg-brand-surface/40 border-b border-brand-surface-hover px-8 py-4 justify-between items-center">
          <h2 className="text-sm font-mono text-brand-text-muted uppercase tracking-wider">
            {location.pathname.split('/').slice(2).join(' / ') || 'Dashboard'}
          </h2>
          
          <div className="flex items-center space-x-4 relative">
            
            {/* Desktop Notification Bell */}
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

            {/* Notifications Dropdown Panel */}
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

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {location.pathname !== '/app' && location.pathname !== '/app/' && (
            <div className="mb-4">
              <Link to="/app" className="inline-flex items-center text-xs font-mono text-brand-text-muted hover:text-brand-lime transition-colors">
                <ArrowLeft size={14} className="mr-1.5" /> Back to Dashboard
              </Link>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* ==========================================
          MOBILE FIXED BOTTOM NAVIGATION
         ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-surface border-t border-brand-surface-hover grid grid-cols-5 py-2">
        {[
          { name: 'Home', path: '/app', icon: LayoutDashboard, exact: true },
          { name: 'Find', path: '/app/find', icon: Search },
          { name: 'Bookings', path: '/app/bookings', icon: Calendar },
          { name: 'Favs', path: '/app/favorites', icon: Heart },
          { name: 'Profile', path: '/app/profile', icon: User }
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

      {/* ==========================================
          CHECKOUT PAYMENT MODAL
         ========================================== */}
      {checkoutBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden text-center">
            
            {checkoutSuccess ? (
              <div className="space-y-4 animate-slide-up py-4">
                <CheckCircle size={48} className="mx-auto text-success" />
                <div>
                  <h3 className="text-lg font-bold text-success">Successful!</h3>
                  <p className="text-sm text-brand-text-muted mt-1">Thank you. Gate is opening.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-slide-up">
                <div className="w-16 h-16 bg-brand-lime/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">₹</span>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">Payment Required</h3>
                  <p className="text-xs text-brand-text-muted mt-1">Please pay to exit the parking lot.</p>
                </div>

                <div className="bg-[#0A0A0B] p-4 rounded-xl border border-brand-surface-hover space-y-2">
                  {checkoutBooking && (() => {
                    const entryTime = checkoutBooking.actual_entry_at ? new Date(checkoutBooking.actual_entry_at).getTime() : new Date(checkoutBooking.start_time).getTime();
                    const exitTime = checkoutBooking.exit_scanned_at ? new Date(checkoutBooking.exit_scanned_at).getTime() : Date.now();
                    const ms = exitTime - entryTime;
                    
                    // Exact calculation: hours and minutes
                    const totalMins = Math.max(1, Math.floor(ms / (1000 * 60)));
                    const hrs = Math.floor(totalMins / 60);
                    const mins = totalMins % 60;
                    const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                    
                    const rate = checkoutBooking.slot?.price_per_hour || 0;
                    // For WALKIN, final amount is calculated dynamically based on total time minus entry fee
                    let exactAmount = checkoutBooking.final_amount;
                    if (checkoutBooking.booking_type === 'WALKIN' && rate > 0) {
                      // Calculate exact proportional rate based on minutes (rate / 60 per minute)
                      const exactProportional = (totalMins / 60) * rate;
                      exactAmount = Math.max(0, exactProportional - checkoutBooking.entry_fee);
                      // Format to 2 decimal places
                      exactAmount = parseFloat(exactAmount.toFixed(2));
                    }

                    return (
                      <>
                        <div className="flex justify-between items-center text-[11px] text-brand-text-muted">
                          <span>Exact Time Parked</span>
                          <span className="font-mono">{durationStr}</span>
                        </div>
                        {rate > 0 && (
                          <div className="flex justify-between items-center text-[11px] text-brand-text-muted">
                            <span>Hourly Rate</span>
                            <span className="font-mono">₹{rate}/hr</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[10px] text-brand-text-muted font-mono pt-1">
                          <span>Vehicle</span>
                          <span>{checkoutBooking.vehicle?.registration_number || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-brand-surface-hover pt-2 mt-2">
                          <span className="text-xs text-white font-bold">Total Amount Due</span>
                          <span className="font-mono font-bold text-lg text-brand-lime">₹{exactAmount}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutPayment}
                  disabled={processingCheckout}
                  className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(132,204,22,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processingCheckout ? (
                    <RefreshCcw className="animate-spin" size={18} />
                  ) : (
                    <span>Pay Now</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
