import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { ParkingLocation, PricingRule } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  BarChart3, Building, TrendingUp, HelpCircle, 
  AlertCircle, ShieldCheck, PlayCircle, Compass 
} from 'lucide-react';

export const OwnerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocId, setSelectedLocId] = useState('');
  
  // Pricing Rules configurations state
  const [ruleEnabled, setRuleEnabled] = useState(true);
  const [minPrice, setMinPrice] = useState(25);
  const [maxPrice, setMaxPrice] = useState(80);
  const [threshold1, setThreshold1] = useState(50);
  const [mult1, setMult1] = useState(1.1);
  const [threshold2, setThreshold2] = useState(80);
  const [mult2, setMult2] = useState(1.2);
  const [savingRule, setSavingRule] = useState(false);

  // Demand Forecast state
  const [forecastData, setForecastData] = useState<any[]>([]);

  const loadProperties = async () => {
    if (user) {
      try {
        const data = await dbService.getParkingLocations('OWNER', user.id);
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocId(data[0].id);
        }
      } catch (err: any) {
        showToast('Error loading properties.', 'error');
      }
    }
  };

  const loadRuleAndForecast = async () => {
    if (!selectedLocId) return;
    try {
      // Load pricing rule
      const rule = await dbService.getPricingRules(selectedLocId);
      if (rule) {
        setRuleEnabled(rule.is_enabled);
        setMinPrice(rule.min_price);
        setMaxPrice(rule.max_price);
        setThreshold1(rule.occupancy_threshold_1);
        setMult1(rule.multiplier_1);
        setThreshold2(rule.occupancy_threshold_2);
        setMult2(rule.multiplier_2);
      } else {
        // Reset to default settings
        setRuleEnabled(false);
        setMinPrice(25);
        setMaxPrice(80);
      }

      // Load forecast
      const forecast = await dbService.getDemandForecast(selectedLocId);
      setForecastData(forecast);

    } catch (err: any) {
      showToast('Error loading forecast stats.', 'error');
    }
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    loadRuleAndForecast();
  }, [selectedLocId]);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocId) return;

    try {
      setSavingRule(true);
      await dbService.savePricingRule({
        location_id: selectedLocId,
        rule_name: 'Dynamic Congestion Fee',
        is_enabled: ruleEnabled,
        min_price: Number(minPrice),
        max_price: Number(maxPrice),
        occupancy_threshold_1: Number(threshold1),
        multiplier_1: Number(mult1),
        occupancy_threshold_2: Number(threshold2),
        multiplier_2: Number(mult2)
      });
      showToast('Dynamic pricing rules configuration updated!', 'success');
      loadRuleAndForecast();
    } catch (err: any) {
      showToast('Failed to update pricing rules.', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Demand Analytics</h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">Set dynamic pricing multipliers based on live spot occupancy</p>
        </div>

        {/* Location selector */}
        <div className="flex items-center space-x-2">
          <Building size={16} className="text-brand-lime" />
          <select
            value={selectedLocId}
            onChange={e => setSelectedLocId(e.target.value)}
            className="bg-brand-surface border border-brand-surface-hover rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-brand-lime transition-all"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==========================================
            LEFT COLUMN: SMART PRICING SETTINGS
           ========================================== */}
        <form onSubmit={handleSaveRule} className="lg:col-span-6 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
              <TrendingUp size={16} />
              <span>Smart Pricing Rules</span>
            </h3>
            
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-brand-text-muted">ACTIVE</span>
              <input
                type="checkbox"
                checked={ruleEnabled}
                onChange={e => setRuleEnabled(e.target.checked)}
                className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime h-4 w-4"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase">Min Floor Price (₹)</label>
              <input
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(Number(e.target.value))}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase">Max Cap Price (₹)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Threshold 1 */}
          <div className="bg-[#0F0F10] p-4 rounded-xl border border-brand-surface-hover space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-brand-lime">
              <span>Tier 1 modifier</span>
              <span className="text-[9px] text-brand-text-muted uppercase">Moderate occupancy</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-brand-text-muted uppercase">Occupancy threshold (%)</span>
                <input
                  type="number" value={threshold1}
                  onChange={e => setThreshold1(Number(e.target.value))}
                  className="w-full bg-brand-charcoal border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-1.5 font-mono text-white outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-brand-text-muted uppercase">Price Multiplier</span>
                <input
                  type="number" step="0.1" value={mult1}
                  onChange={e => setMult1(Number(e.target.value))}
                  className="w-full bg-brand-charcoal border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-1.5 font-mono text-white outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Threshold 2 */}
          <div className="bg-[#0F0F10] p-4 rounded-xl border border-brand-surface-hover space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-brand-lime">
              <span>Tier 2 modifier</span>
              <span className="text-[9px] text-brand-text-muted uppercase">High congestion</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-brand-text-muted uppercase">Occupancy threshold (%)</span>
                <input
                  type="number" value={threshold2}
                  onChange={e => setThreshold2(Number(e.target.value))}
                  className="w-full bg-brand-charcoal border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-1.5 font-mono text-white outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-brand-text-muted uppercase">Price Multiplier</span>
                <input
                  type="number" step="0.1" value={mult2}
                  onChange={e => setMult2(Number(e.target.value))}
                  className="w-full bg-brand-charcoal border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-1.5 font-mono text-white outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingRule}
            className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-1"
          >
            {savingRule ? 'Saving rules...' : 'Apply Pricing configurations'}
          </button>
        </form>

        {/* ==========================================
            RIGHT COLUMN: DEMAND FORECAST CHART
           ========================================== */}
        <div className="lg:col-span-6 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
              <BarChart3 size={16} />
              <span>Congestion Forecasting</span>
            </h3>
            <span className="text-[10px] text-brand-text-muted">Expected Occupancy %</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1C1C20" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={10} fontStyle="mono" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121214', border: '1px solid #1C1C20', color: '#FAFAFA' }}
                  labelClassName="text-brand-lime font-mono text-xs"
                />
                <Area type="monotone" dataKey="expected_occupancy_pct" stroke="#84CC16" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={2} name="Occupancy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0F0F10] border border-brand-surface-hover p-4 rounded-xl text-xs text-brand-text-muted leading-relaxed flex items-start space-x-2.5">
            <AlertCircle size={16} className="text-brand-lime shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Forecast Audit summary</span>
              <p>Congestion is high from 09:00 - 13:00 (Office start) and 18:00 - 21:00 (Evening rush). Dynamic pricing multipliers will automatically adjust check-in pricing fees based on these thresholds.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
