import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbAdapter';
import { Booking, ParkingLocation, ParkingSlot } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  Building, Landmark, Calendar, Percent, ArrowUpRight, 
  TrendingUp, Activity, Sparkles, AlertCircle 
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotsCount, setSlotsCount] = useState({ total: 0, available: 0, occupied: 0 });
  const [revenueStats, setRevenueStats] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  // Load owner data
  const loadOwnerData = async () => {
    if (user) {
      try {
        setLoading(true);
        // Load locations
        const listLocs = await dbService.getParkingLocations('OWNER', user.id);
        setLocations(listLocs);

        // Load bookings for owner locations
        const listBookings = await dbService.getBookings('OWNER', user.id);
        setBookings(listBookings);

        // Fetch aggregate slot status count
        let total = 0;
        let available = 0;
        let occupied = 0;

        for (const loc of listLocs) {
          const slots = await dbService.getParkingSlots(loc.id);
          total += slots.length;
          available += slots.filter(s => s.status === 'AVAILABLE').length;
          occupied += slots.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED').length;
        }
        setSlotsCount({ total, available, occupied });

        // Calculate Revenue statistics
        const completedBookings = listBookings.filter(b => b.status === 'COMPLETED' || b.status === 'ACTIVE' || b.status === 'CONFIRMED');
        const nowMs = Date.now();
        
        let today = 0;
        let week = 0;
        let month = 0;

        completedBookings.forEach(b => {
          const bTime = new Date(b.created_at).getTime();
          const amt = Number(b.total_price);
          
          if (nowMs - bTime < 24 * 3600 * 1000) today += amt;
          if (nowMs - bTime < 7 * 24 * 3600 * 1000) week += amt;
          if (nowMs - bTime < 30 * 24 * 3600 * 1000) month += amt;
        });

        // Set revenue stats
        setRevenueStats({ today, week, month });

      } catch (err: any) {
        showToast('Error loading owner dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [user]);

  // Recharts Chart mock datasets (matching seed data counts)
  const occupancyData = [
    { hour: '08:00', occupancy: 20 },
    { hour: '10:00', occupancy: 65 },
    { hour: '12:00', occupancy: 85 },
    { hour: '14:00', occupancy: 90 },
    { hour: '16:00', occupancy: 70 },
    { hour: '18:00', occupancy: 80 },
    { hour: '20:00', occupancy: 95 },
    { hour: '22:00', occupancy: 40 },
  ];

  const weeklyRevenueData = [
    { day: 'Mon', revenue: 4200 },
    { day: 'Tue', revenue: 5100 },
    { day: 'Wed', revenue: 3800 },
    { day: 'Thu', revenue: 6200 },
    { day: 'Fri', revenue: 7800 },
    { day: 'Sat', revenue: 9500 },
    { day: 'Sun', revenue: 8400 },
  ];

  const hasPendingListing = locations.some(l => l.status === 'PENDING_REVIEW');

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Title greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-brand-text-muted mt-1">Monitor parking occupancy, revenue payout trends, and client checkins</p>
        </div>

        <button 
          onClick={() => navigate('/owner/parking')}
          className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center space-x-1"
        >
          <span>List New Property</span>
        </button>
      </div>

      {/* Pending approval warning banner */}
      {hasPendingListing && (
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed text-warning">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Listing Awaiting Approval</span>
            <span>You have submitted a parking location that is currently in 'PENDING_REVIEW' state. Our administrative team will audit the coordinates and details within 24 hours.</span>
          </div>
        </div>
      )}

      {/* Aggregate Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Monthly Earnings</span>
            <Landmark size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">₹{revenueStats.month.toLocaleString()}</span>
            <span className="text-[10px] text-success font-mono block mt-1">▲ 12% vs last month</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Live Occupancy</span>
            <Percent size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">
              {slotsCount.total > 0 ? Math.round((slotsCount.occupied / slotsCount.total) * 100) : 0}%
            </span>
            <span className="text-[10px] text-brand-text-muted font-mono block mt-1">
              {slotsCount.occupied} of {slotsCount.total} bays filled
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Total Bookings</span>
            <Calendar size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">{bookings.length}</span>
            <span className="text-[10px] text-brand-text-muted font-mono block mt-1">Stays processed to date</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center text-brand-text-muted">
            <span className="text-[10px] font-mono uppercase tracking-widest">Properties Live</span>
            <Building size={18} className="text-brand-lime" />
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-white">
              {locations.filter(l => l.status === 'APPROVED').length}
            </span>
            <span className="text-[10px] text-brand-text-muted font-mono block mt-1">
              Approved slots ready for rent
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Revenue bar chart */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
              <TrendingUp size={16} />
              <span>Weekly Payout Revenue</span>
            </h3>
            <span className="text-[10px] text-brand-text-muted">Net INR Payouts</span>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1C1C20" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121214', border: '1px solid #1C1C20', color: '#FAFAFA' }}
                  labelClassName="text-brand-lime font-mono text-xs"
                />
                <Bar dataKey="revenue" fill="#84CC16" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Occupancy Area chart */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
              <Activity size={16} />
              <span>Average Daily Occupancy</span>
            </h3>
            <span className="text-[10px] text-brand-text-muted">Rush Hour Congestion curves</span>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1C1C20" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121214', border: '1px solid #1C1C20', color: '#FAFAFA' }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#84CC16" fillOpacity={1} fill="url(#colorOcc)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Reservations overview list */}
      <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3 font-mono">
          <Sparkles size={16} />
          <span>Real-time Parking Feeds</span>
        </h3>

        <div className="space-y-3">
          {bookings.slice(0, 3).map(b => (
            <div 
              key={b.id}
              className="bg-[#0F0F10] border border-brand-surface-hover p-4 rounded-xl flex items-center justify-between text-xs transition-all hover:border-brand-lime/10"
            >
              <div className="space-y-1">
                <p className="font-bold text-white">{b.driver?.full_name || 'Rahul Sharma'}</p>
                <p className="text-[10px] text-brand-text-muted font-mono">Slot {b.slot?.slot_number} • Reg: {b.vehicle?.registration_number}</p>
              </div>
              
              <div className="text-right">
                <span className={`text-[8px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  b.status === 'COMPLETED' ? 'bg-success/15 border-success/30 text-success' : 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime'
                }`}>
                  {b.status}
                </span>
                <span className="text-[10px] font-mono text-white block mt-1">₹{b.total_price}</span>
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="text-xs text-brand-text-muted text-center py-6">No reservations received yet.</p>
          )}
        </div>
      </div>

    </div>
  );
};
