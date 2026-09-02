import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Shield, Zap, RefreshCw, Star, CheckCircle, CreditCard, 
  TrendingUp, Users, ArrowRight, Smartphone, Eye, Check 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Live availability counter animation
  const [availabilityCount, setAvailabilityCount] = useState(2500);

  useEffect(() => {
    const interval = setInterval(() => {
      setAvailabilityCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3; // randomized flux -3 to +3
        return Math.min(3000, Math.max(2000, prev + delta));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Sticky Navbar state
  const [isSticky, setIsSticky] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock slot interactive states for hero visualization
  const [selectedHeroSlot, setSelectedHeroSlot] = useState<string | null>('Slot-A3');
  const heroSlots = [
    { id: 'Slot-A1', status: 'OCCUPIED', type: 'CAR' },
    { id: 'Slot-A2', status: 'AVAILABLE', type: 'EV' },
    { id: 'Slot-A3', status: 'SELECTED', type: 'CAR' },
    { id: 'Slot-A4', status: 'OCCUPIED', type: 'ACCESSIBLE' },
    { id: 'Slot-B1', status: 'AVAILABLE', type: 'BIKE' },
    { id: 'Slot-B2', status: 'AVAILABLE', type: 'CAR' },
  ];

  return (
    <div className="min-h-screen bg-brand-charcoal text-white selection:bg-brand-lime selection:text-black">
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSticky 
          ? 'bg-brand-charcoal/90 backdrop-blur-md border-b border-brand-surface-hover py-4' 
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-lg">P</div>
            <span className="text-xl font-bold tracking-tight font-sans">Parkly</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-brand-text-muted">
            <a href="#product" className="hover:text-brand-lime transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-brand-lime transition-colors">How It Works</a>
            <a href="#owners" className="hover:text-brand-lime transition-colors">For Owners</a>
            <a href="#features" className="hover:text-brand-lime transition-colors">Features</a>
            <a href="#about" className="hover:text-brand-lime transition-colors">About</a>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <button 
                onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'OWNER' ? '/owner' : '/app')} 
                className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-1"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold hover:text-brand-lime transition-colors">Login</Link>
                <Link 
                  to="/signup" 
                  className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(132,204,22,0.2)] hover:shadow-[0_0_20px_rgba(132,204,22,0.4)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-36 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-brand-surface border border-brand-surface-hover rounded-full px-3 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse"></span>
            <span className="text-brand-text-muted font-mono">24/7 Smart Marketplace Live</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none">
            Find a spot. <br/>
            <span className="text-brand-lime bg-gradient-to-r from-brand-lime to-brand-lime-glow bg-clip-text text-transparent">Park smarter.</span>
          </h1>
          <p className="text-base md:text-lg text-brand-text-muted max-w-lg leading-relaxed">
            Discover, reserve, and rent parking spaces in real time — wherever you go. Instantly check slot occupancy, lock in low rates, and navigate directly with your smartphone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button 
              onClick={() => navigate('/signup')} 
              className="bg-brand-lime hover:bg-brand-lime-hover text-black text-center px-6 py-3 rounded-lg font-semibold transition-all shadow-[0_0_25px_rgba(132,204,22,0.2)]"
            >
              Find Parking
            </button>
            <button 
              onClick={() => navigate('/signup?role=OWNER')} 
              className="bg-brand-surface hover:bg-brand-surface-hover text-white text-center border border-brand-surface-hover px-6 py-3 rounded-lg font-semibold transition-all"
            >
              List Your Space
            </button>
          </div>
        </div>

        {/* Interactive Hero Visual Mockup */}
        <div className="lg:col-span-6 bg-brand-surface border border-brand-surface-hover rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 bg-brand-surface-hover/80 px-4 py-2 border-b border-brand-surface-hover flex justify-between items-center">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-error/40"></span>
              <span className="w-3 h-3 rounded-full bg-warning/40"></span>
              <span className="w-3 h-3 rounded-full bg-success/40"></span>
            </div>
            <span className="text-xs font-mono text-brand-text-muted">app.parkly.io/live-radar</span>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Grid 1: Radar View (Mini Mock Map) */}
            <div className="md:col-span-2 bg-[#0F0F10] border border-brand-surface-hover rounded-lg p-3 relative h-64 overflow-hidden">
              {/* Fake Map Grid lines */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-[0.03] pointer-events-none">
                {Array.from({ length: 36 }).map((_, idx) => (
                  <div key={idx} className="border border-white"></div>
                ))}
              </div>
              
              {/* Map roads mock */}
              <div className="absolute top-1/3 left-0 right-0 h-8 bg-brand-surface/40 border-y border-brand-surface-hover rounded pointer-events-none"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-brand-surface/40 border-x border-brand-surface-hover rounded pointer-events-none"></div>
              
              {/* User Position marker */}
              <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-pulse"></span>
                <span className="bg-brand-surface text-[9px] border border-brand-surface-hover px-1 rounded mt-1 font-mono text-blue-400">You</span>
              </div>

              {/* Pulsing parking marker */}
              <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-lime"></span>
                </span>
                <span className="bg-brand-surface text-[10px] border border-brand-lime/30 px-1.5 py-0.5 rounded mt-1 font-mono font-semibold text-brand-lime">₹40/hr</span>
              </div>
              
              {/* Map instructions overlay */}
              <div className="absolute bottom-2 left-2 bg-brand-surface/90 border border-brand-surface-hover px-2 py-1 rounded text-[10px] text-brand-text-muted font-mono flex items-center space-x-1.5">
                <MapPin size={10} className="text-brand-lime" />
                <span>MG Road, Bengaluru</span>
              </div>

              {/* Simulated Route Line SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path 
                  d="M 230 135 L 140 135 L 140 70 L 65 70" 
                  fill="none" 
                  stroke="#84CC16" 
                  strokeWidth="2.5" 
                  strokeDasharray="4 4" 
                  className="animate-pulse"
                />
              </svg>
            </div>

            {/* Grid 2: Smart Info Panel */}
            <div className="bg-[#0F0F10] border border-brand-surface-hover rounded-lg p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider block mb-1">SELECTED SPOT</span>
                <span className="text-xl font-bold text-brand-lime font-mono">{selectedHeroSlot}</span>
                <div className="mt-2 space-y-1">
                  <div className="text-xs flex justify-between text-brand-text-muted">
                    <span>Floor:</span>
                    <span className="font-mono text-white">Floor 1</span>
                  </div>
                  <div className="text-xs flex justify-between text-brand-text-muted">
                    <span>Rate:</span>
                    <span className="font-mono text-white">₹40 / hr</span>
                  </div>
                  <div className="text-xs flex justify-between text-brand-text-muted">
                    <span>Type:</span>
                    <span className="font-mono text-white flex items-center space-x-1">
                      <Zap size={10} className="text-brand-lime" />
                      <span>EV Charger</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/signup')}
                className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black font-semibold text-xs py-2 rounded transition-all mt-4"
              >
                Book Now
              </button>
            </div>

          </div>

          {/* Slot visualizer interactive demo in hero */}
          <div className="mt-4 bg-[#0F0F10] border border-brand-surface-hover rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">Interactive Layout Selector</span>
              <span className="text-[10px] bg-brand-lime/10 text-brand-lime px-1.5 py-0.5 rounded font-mono">Live Sync</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {heroSlots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => slot.status === 'AVAILABLE' && setSelectedHeroSlot(slot.id)}
                  className={`border py-2 rounded text-xs font-mono font-bold transition-all relative ${
                    slot.status === 'OCCUPIED' 
                      ? 'border-brand-surface-hover bg-brand-surface-hover/20 text-error cursor-not-allowed' 
                      : slot.id === selectedHeroSlot 
                        ? 'border-brand-lime bg-brand-lime/10 text-brand-lime shadow-[0_0_10px_rgba(132,204,22,0.1)]' 
                        : 'border-brand-surface bg-brand-surface/40 hover:border-brand-lime/50 text-success'
                  }`}
                  disabled={slot.status === 'OCCUPIED'}
                >
                  {slot.id.split('-')[1]}
                  <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
                    slot.status === 'OCCUPIED' ? 'bg-error' : slot.id === selectedHeroSlot ? 'bg-brand-lime' : 'bg-success'
                  }`}></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Availability Banner */}
      <section className="bg-brand-surface border-y border-brand-surface-hover py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-sm font-mono text-brand-lime uppercase tracking-widest">Real-time Platform Activity</h3>
            <p className="text-xl text-brand-text-muted mt-1">SaaS marketplace connecting empty properties directly to drivers.</p>
          </div>
          <div className="bg-[#0F0F10] border border-brand-surface-hover px-8 py-4 rounded-xl flex flex-col items-center justify-center min-w-[220px]">
            <span className="text-4xl font-extrabold font-mono text-brand-lime tracking-tight tabular-nums">
              {availabilityCount.toLocaleString()}
            </span>
            <span className="text-xs text-brand-text-muted font-mono uppercase tracking-wider mt-1">spaces available now</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
          <h2 className="text-brand-lime font-mono text-xs uppercase tracking-widest">THREE SIMPLE STEPS</h2>
          <p className="text-3xl md:text-4xl font-extrabold tracking-tight">How Parkly Works</p>
          <p className="text-brand-text-muted text-sm leading-relaxed">
            Reserve parking spaces at premium corporate spots, private driveways, and underground garages in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-6 space-y-4 hover:border-brand-lime/30 transition-all group">
            <span className="text-4xl font-black font-mono text-brand-lime/20 group-hover:text-brand-lime/40 transition-colors">01</span>
            <h3 className="text-lg font-bold">Find Parking</h3>
            <p className="text-brand-text-muted text-sm leading-relaxed">
              Enter your destination, dates, times, and vehicle type. Browse real-time slot occupancy and filter listings by CCTV, EV charging, and rates.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-6 space-y-4 hover:border-brand-lime/30 transition-all group">
            <span className="text-4xl font-black font-mono text-brand-lime/20 group-hover:text-brand-lime/40 transition-colors">02</span>
            <h3 className="text-lg font-bold">Select & Reserve</h3>
            <p className="text-brand-text-muted text-sm leading-relaxed">
              Interact with the visual parking layout to pick your specific slot (Floor grid). Complete booking via a secure UPI or card payment simulation.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-6 space-y-4 hover:border-brand-lime/30 transition-all group">
            <span className="text-4xl font-black font-mono text-brand-lime/20 group-hover:text-brand-lime/40 transition-colors">03</span>
            <h3 className="text-lg font-bold">Scan & Park</h3>
            <p className="text-brand-text-muted text-sm leading-relaxed">
              Navigate to the lot using the app directions. Scan your digital QR pass at the entrance check-in kiosk. Drive directly to your reserved space.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="bg-[#0F0F10] border-y border-brand-surface-hover py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-brand-lime font-mono text-xs uppercase tracking-widest">PRODUCT FEATURES</h2>
            <p className="text-3xl md:text-4xl font-extrabold tracking-tight">Smart Mobility Tools</p>
            <p className="text-brand-text-muted text-sm leading-relaxed">
              Every detail is architected for premium usability and instant feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: 'Real-time Availability', desc: 'Supabase Realtime updates slot statuses instantly when reserved.' },
              { icon: Shield, title: 'Secure Reservations', desc: 'PostgreSQL exclusion rules guard against concurrent double-bookings.' },
              { icon: Smartphone, title: 'QR Parking Pass', desc: 'Secure generated tokens inside passes. Scan at check-in/out consoles.' },
              { icon: TrendingUp, title: 'Smart Pricing rules', desc: 'Adjust parking hourly prices based on current occupancy automatically.' },
              { icon: CreditCard, title: 'Demo Payments', desc: 'UPI and credit card checkout simulation flows. Zero live credit card required.' },
              { icon: Zap, title: 'EV Charging Filter', desc: 'Identify lots equipped with charging towers. Reserve slots with plugs.' },
              { icon: Eye, title: 'Admin Audit Logs', desc: 'Track booking creations, slot status overrides, and user suspensions.' },
              { icon: Users, title: 'Multi-Role Panels', desc: 'Different tailored views and workflows for drivers, owners, and admins.' },
            ].map((f, i) => (
              <div key={i} className="bg-brand-surface border border-brand-surface-hover rounded-xl p-5 hover:border-brand-lime/20 transition-all">
                <f.icon className="text-brand-lime mb-3" size={24} />
                <h4 className="text-base font-bold mb-1.5">{f.title}</h4>
                <p className="text-brand-text-muted text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Owners Section */}
      <section id="owners" className="py-24 px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="bg-gradient-to-br from-brand-surface to-[#0A0A0B] border border-brand-surface-hover rounded-2xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="text-brand-lime font-mono text-xs uppercase tracking-widest">OWNER MARKETPLACE</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Turn empty parking spaces into passive income.</h2>
            <p className="text-brand-text-muted text-sm leading-relaxed">
              List unused private driveways, residential garages, apartment slots, commercial structures, or vacant plots. Set your own opening hours, pricing policies, and slots layout in minutes.
            </p>
            <ul className="space-y-3 text-sm text-brand-text-muted">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-brand-lime" />
                <span>Flexible pricing (Hourly limits, base charges)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-brand-lime" />
                <span>Automatic smart peak pricing adjustments</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-brand-lime" />
                <span>Interactive slots layout builder and scanner logs</span>
              </li>
            </ul>
            <button 
              onClick={() => navigate('/signup?role=OWNER')} 
              className="bg-brand-lime hover:bg-brand-lime-hover text-black px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2"
            >
              <span>List Your Space</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Interactive Layout Builder mockup */}
          <div className="bg-brand-charcoal border border-brand-surface-hover rounded-xl p-5 shadow-inner">
            <div className="flex justify-between items-center mb-4 border-b border-brand-surface-hover pb-2">
              <span className="text-[10px] font-mono text-brand-text-muted uppercase">Layout Builder Preview</span>
              <div className="flex space-x-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-success/15 text-success">Active</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-brand-surface-hover text-brand-text-muted">Floor 1</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {['A01', 'A02', 'A03', 'A04', 'B01', 'B02', 'B03', 'B04'].map((num, i) => (
                <div key={i} className="border border-brand-surface-hover bg-brand-surface/40 p-3 rounded flex flex-col items-center space-y-1">
                  <span className="text-[10px] font-mono font-semibold">{num}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    i === 1 || i === 5 ? 'bg-error' : i === 3 ? 'bg-warning' : 'bg-success'
                  }`}></span>
                  <span className="text-[9px] text-brand-text-muted font-mono">₹40/hr</span>
                </div>
              ))}
            </div>
            
            {/* Revenue Analytics Preview inside Owner widget */}
            <div className="mt-4 bg-brand-surface/60 border border-brand-surface-hover rounded-lg p-3 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono text-brand-text-muted block uppercase">TOTAL REVENUE (MONTH)</span>
                <span className="text-lg font-extrabold font-mono text-brand-lime">₹98,430</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono text-success block">▲ 14% vs last week</span>
                <span className="text-[10px] text-brand-text-muted">542 bookings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Parking Section */}
      <section className="bg-[#0F0F10] border-y border-brand-surface-hover py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-brand-lime">Demand Forecast</span>
              <span className="text-[10px] font-mono text-brand-text-muted">MG Road Location</span>
            </div>
            
            {/* Custom SVG line Chart mockup for demand prediction */}
            <div className="h-44 flex items-end justify-between pt-4 border-b border-brand-surface-hover relative">
              {/* Reference Grid lines */}
              <div className="absolute inset-x-0 bottom-0 top-4 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-t border-white w-full"></div>
                <div className="border-t border-white w-full"></div>
                <div className="border-t border-white w-full"></div>
              </div>
              
              {/* Bars representing occupancy rates throughout the day */}
              {[20, 25, 45, 80, 95, 75, 40, 50, 85, 90, 30, 15].map((pct, idx) => {
                const hours = ['8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'];
                const displayLabel = idx % 2 === 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center space-y-2 h-full justify-end group">
                    <div 
                      style={{ height: `${pct}%` }} 
                      className={`w-4 rounded-t-sm transition-all group-hover:opacity-85 ${
                        pct > 80 ? 'bg-error' : pct > 45 ? 'bg-warning' : 'bg-success'
                      }`}
                    ></div>
                    {displayLabel && (
                      <span className="text-[9px] font-mono text-brand-text-muted">
                        {hours[Math.floor(idx / 1.5)]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-xs text-brand-text-muted font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-success rounded-sm"></span>
                <span>Low (&lt;45%)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-warning rounded-sm"></span>
                <span>Peak (45-80%)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-error rounded-sm"></span>
                <span>High (&gt;80%)</span>
              </span>
            </div>

            <div className="bg-brand-charcoal p-3 rounded-lg border border-brand-surface-hover text-xs leading-relaxed text-brand-text-muted flex justify-between items-center">
              <span>Smart dynamic rule active: <b>+20% price</b> during &gt;80% occupancy.</span>
              <span className="text-[10px] text-brand-lime font-mono">Active</span>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <span className="text-brand-lime font-mono text-xs uppercase tracking-widest">DYNAMIC ALGORITHMS</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Demand Forecasts & Dynamic Smart Pricing</h2>
            <p className="text-brand-text-muted text-sm leading-relaxed">
              We leverage historical booking ratios to predict daily parking congestion levels. Toggle our smart dynamic pricing module to let rates increase automatically when slots are filling up. Recommend prime spots to drivers searching during peak commuter hours.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-brand-surface-hover p-4 rounded-xl">
                <span className="text-xl font-bold font-mono text-white">₹36 / hr</span>
                <span className="text-[10px] text-brand-text-muted block mt-1 uppercase">Peak Hour Average</span>
              </div>
              <div className="border border-brand-surface-hover p-4 rounded-xl">
                <span className="text-xl font-bold font-mono text-white">92% Match</span>
                <span className="text-[10px] text-brand-text-muted block mt-1 uppercase">Recommendation Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
          <h2 className="text-brand-lime font-mono text-xs uppercase tracking-widest">USER STORIES</h2>
          <p className="text-3xl md:text-4xl font-extrabold tracking-tight">Trusted by Drivers & Owners</p>
          <span className="inline-block text-[10px] bg-brand-surface-hover text-brand-text-muted border border-brand-surface-hover px-2.5 py-0.5 rounded font-mono uppercase tracking-widest">
            Fictional Demo Content
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Arjun Mehta',
              role: 'Daily Commuter (Bangalore)',
              rating: 5,
              comment: 'I save 15 minutes of frustration every single morning. I just book my slot at MG Road Metro Plaza while drinking my coffee, navigate there, scan the QR code and park. Amazing UI!'
            },
            {
              name: 'Priyanka Sen',
              role: 'Office Owner (Connaught Place)',
              rating: 5,
              comment: 'Parkly helps us list vacant corporate slots during weekends. We have processed over 250 checkins. It is completely automated and the revenue is sent directly to our bank account.'
            },
            {
              name: 'Vikram Grover',
              role: 'EV Owner (Delhi)',
              rating: 5,
              comment: 'Finding EV charging slots with working chargers in Connaught Place is a nightmare. Parkly filters for EV slots and reserves the slot. I charge my Nexon while at lunch.'
            }
          ].map((t, i) => (
            <div key={i} className="bg-brand-surface border border-brand-surface-hover rounded-xl p-6 flex flex-col justify-between space-y-4">
              <p className="text-brand-text-muted text-sm leading-relaxed italic">"{t.comment}"</p>
              <div className="flex items-center justify-between pt-4 border-t border-brand-surface-hover">
                <div>
                  <h4 className="text-sm font-bold">{t.name}</h4>
                  <span className="text-[10px] text-brand-text-muted font-mono">{t.role}</span>
                </div>
                <div className="flex space-x-0.5 text-brand-lime">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} size={12} fill="currentColor" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-brand-surface to-brand-charcoal border-t border-brand-surface-hover py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-extrabold tracking-tight">Your parking spot is closer than you think.</h2>
          <p className="text-brand-text-muted text-base max-w-lg mx-auto">
            Create an account in 15 seconds. Seeded with working demo credits and pre-loaded properties so you can explore driver, owner and admin features immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={() => navigate('/signup')} 
              className="bg-brand-lime hover:bg-brand-lime-hover text-black px-6 py-3 rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)]"
            >
              Find Parking
            </button>
            <button 
              onClick={() => navigate('/signup?role=OWNER')} 
              className="bg-brand-charcoal hover:bg-brand-surface-hover text-white border border-brand-surface-hover px-6 py-3 rounded-lg font-bold transition-all"
            >
              List Your Space
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-brand-surface-hover bg-[#070708] py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-lg">P</div>
              <span className="text-xl font-bold tracking-tight">Parkly</span>
            </div>
            <p className="text-brand-text-muted text-xs max-w-xs leading-relaxed">
              Find a spot. Park smarter. The modern peer-to-peer mobility marketplace connecting drivers to vacant properties.
            </p>
            <p className="text-brand-text-muted/60 text-[10px] font-mono">
              © 2026 Parkly Technologies Inc. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono text-brand-lime uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2 text-xs text-brand-text-muted">
              <li><Link to="/signup" className="hover:text-white transition-colors">Find parking</Link></li>
              <li><Link to="/signup?role=OWNER" className="hover:text-white transition-colors">List your driveway</Link></li>
              <li><a href="#features" className="hover:text-white transition-colors">Pricing rules</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Mobile apps</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono text-brand-lime uppercase tracking-widest mb-4">Support</h4>
            <ul className="space-y-2 text-xs text-brand-text-muted">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Safety Standards</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono text-brand-lime uppercase tracking-widest mb-4">Contact</h4>
            <p className="text-xs text-brand-text-muted">
              Koramangala 4th Block,<br />
              Bengaluru, KA 560034<br />
              <span className="text-brand-lime block mt-2 font-mono">demo@parkly.io</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
