import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { Profile, Booking, ParkingLocation } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  Users, Building2, Calendar, Landmark, Activity, 
  ShieldCheck, ArrowUpRight, TrendingUp, AlertOctagon 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  const [usersCount, setUsersCount] = useState(0);
  const [ownersCount, setOwnersCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [platformFees, setPlatformFees] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAdminMetrics = async () => {
    try {
      setLoading(true);
      const profilesList = await dbService.getUsersAdmin();
      setUsersCount(profilesList.filter(p => p.role === 'DRIVER').length);
      setOwnersCount(profilesList.filter(p => p.role === 'OWNER').length);

      const locs = await dbService.getParkingLocations();
      setLocationsCount(locs.filter(l => l.status === 'APPROVED').length);

      const bookingsList = await dbService.getBookings('ADMIN', '');
      setBookingsCount(bookingsList.length);

      // Compute Platform Fees Collected (5% of completed bookings)
      const finished = bookingsList.filter(b => b.status === 'COMPLETED' || b.status === 'ACTIVE' || b.status === 'CONFIRMED');
      const gross = finished.reduce((sum, b) => sum + Number(b.total_price), 0);
      setPlatformFees(Math.ceil(gross * 0.05));
    } catch (err: any) {
      showToast('Error loading platform metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  const signupGrowthData = [
    { month: 'Mar', drivers: 45, owners: 12 },
    { month: 'Apr', drivers: 75, owners: 18 },
    { month: 'May', drivers: 120, owners: 22 },
    { month: 'Jun', drivers: 185, owners: 31 },
    { month: 'Jul', drivers: 290, owners: 45 },
    { month: 'Aug', drivers: 420, owners: 54 },
  ];

  const transactionData = [
    { name: 'W1', value: 800 },
    { name: 'W2', value: 1200 },
    { name: 'W3', value: 1900 },
    { name: 'W4', value: 3200 },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Superuser Console</h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">Audit platform-wide transaction feeds, registration growth indices, and logs</p>
        </div>
        
        <button 
          onClick={loadAdminMetrics}
          className="border border-brand-surface-hover hover:border-brand-lime/20 text-brand-text-muted hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold font-mono"
        >
          FORCE RELOAD
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Platform Fees Collected</span>
            <Landmark size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">₹{platformFees.toLocaleString()}</span>
            <span className="text-[10px] text-brand-lime font-mono block mt-1">5% fee cut live</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Drivers Registered</span>
            <Users size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">{usersCount}</span>
            <span className="text-[10px] text-success font-mono block mt-1">▲ 18% growth this week</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Live Operators</span>
            <Building2 size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">{ownersCount}</span>
            <span className="text-[10px] text-brand-text-muted font-mono block mt-1">Property owners active</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Total Bookings</span>
            <Calendar size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">{bookingsCount}</span>
            <span className="text-[10px] text-brand-text-muted font-mono block mt-1">Cumulative bookings queue</span>
          </div>
        </div>
      </div>

      {/* Analytics Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Registration Line Chart */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
              <TrendingUp size={16} />
              <span>Driver vs Owner registration curve</span>
            </h3>
            <span className="text-[10px] text-brand-text-muted">6 Month Aggregates</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signupGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1C1C20" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#121214', border: '1px solid #1C1C20' }} />
                <Line type="monotone" dataKey="drivers" stroke="#84CC16" strokeWidth={2} name="Drivers" />
                <Line type="monotone" dataKey="owners" stroke="#3B82F6" strokeWidth={2} name="Owners" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Volume Bar Chart */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
              <Activity size={16} />
              <span>Weekly Transaction Value volume</span>
            </h3>
            <span className="text-[10px] text-brand-text-muted">Total Gross INR</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1C1C20" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#121214', border: '1px solid #1C1C20' }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Value (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
