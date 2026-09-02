import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { Booking, Payment, Payout } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Landmark, ArrowUpRight, LandmarkIcon, RefreshCcw, 
  ArrowRight, ShieldCheck, HelpCircle, CheckCircle2, Receipt
} from 'lucide-react';

export const OwnerRevenue: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Bank Withdrawal simulation form
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNum, setAccountNum] = useState('•••• •••• •••• 5432');
  const [withdrawing, setWithdrawing] = useState(false);

  const loadRevenueData = async () => {
    if (user) {
      try {
        setLoading(true);
        // Load bookings
        const listBookings = await dbService.getBookings('OWNER', user.id);
        setBookings(listBookings);

        // Load payouts
        const listPayouts = await dbService.getPayouts(user.id);
        setPayouts(listPayouts);

        // Load payments corresponding to completed bookings
        const allPayments = localStorage.getItem('parkly_payments');
        if (allPayments) {
          const listPays: Payment[] = JSON.parse(allPayments);
          const bIds = listBookings.map(b => b.id);
          setPayments(listPays.filter(p => bIds.includes(p.booking_id)));
        } else if (dbService.isRealSupabase) {
          // If in supabase mode, fetch from DB invoices/payments if available
          const { data } = await (dbService as any).supabase.from('payments').select('*');
          if (data) {
            const bIds = listBookings.map(b => b.id);
            setPayments(data.filter((p: any) => bIds.includes(p.booking_id)));
          }
        }
      } catch (err: any) {
        showToast('Error loading financial reports.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, [user]);

  const handleWithdrawEarnings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availableBalance <= 0) {
      showToast('No payouts available for withdrawal.', 'warning');
      return;
    }

    setWithdrawing(true);
    try {
      await dbService.requestPayout(user!.id, availableBalance);
      
      showToast(`Simulated payout of ₹${availableBalance.toLocaleString()} transferred to ${bankName}.`, 'success');
      
      // Trigger canvas confetti animation dynamically
      import('canvas-confetti').then((conf) => {
        conf.default({ particleCount: 60, spread: 60 });
      });

      await loadRevenueData();
    } catch (err: any) {
      showToast('Payout request failed.', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  // Financial aggregates calculations
  const grossRevenue = bookings
    .filter(b => b.status === 'COMPLETED' || b.status === 'ACTIVE' || b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const platformFee = Math.ceil(grossRevenue * 0.05); // 5% platform fee
  const netEarnings = grossRevenue - platformFee;

  const totalPayouts = payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const availableBalance = Math.max(0, netEarnings - totalPayouts);

  const refundsProcessed = bookings
    .filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED')
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Earnings & Revenue</h1>
        <p className="text-xs text-brand-text-muted mt-1 font-sans">Audit financial statements, process payouts and withdrawals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==========================================
            LEFT COLUMN: FINANCIAL STATEMENTS
           ========================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Revenue Widgets grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-4 space-y-1">
              <span className="text-[9px] font-mono text-brand-text-muted uppercase">Gross Revenue</span>
              <span className="text-lg font-extrabold font-mono text-white block">₹{grossRevenue.toLocaleString()}</span>
            </div>
            <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-4 space-y-1">
              <span className="text-[9px] font-mono text-brand-text-muted uppercase">Platform Fee (5%)</span>
              <span className="text-lg font-extrabold font-mono text-brand-text-muted block">₹{platformFee.toLocaleString()}</span>
            </div>
            <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-4 space-y-1">
              <span className="text-[9px] font-mono text-brand-text-muted uppercase">Net Earnings</span>
              <span className="text-lg font-extrabold font-mono text-brand-lime block">₹{netEarnings.toLocaleString()}</span>
            </div>
          </div>

          {/* Refunded column */}
          <div className="bg-brand-surface/40 border border-brand-surface-hover rounded-xl p-4 flex justify-between items-center text-xs font-mono text-brand-text-muted">
            <span>Refunds processed to cancelled bookings:</span>
            <span className="text-error font-bold">₹{refundsProcessed.toLocaleString()}</span>
          </div>

          {/* Transaction Ledger Table */}
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
                <LandmarkIcon size={16} />
                <span>Transaction Ledger</span>
              </h3>
              <button onClick={loadRevenueData}><RefreshCcw size={11} className="text-brand-text-muted hover:text-white" /></button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-brand-surface-hover text-brand-text-muted uppercase text-[10px] font-mono">
                    <th className="py-2.5">Transaction ID</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Method</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id} className="border-b border-brand-surface-hover/50 text-brand-text-muted hover:text-white transition-colors">
                      <td className="py-3 font-mono font-bold text-white">{pay.transaction_id}</td>
                      <td className="py-3">{new Date(pay.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-mono">{pay.payment_method}</td>
                      <td className="py-3 font-mono font-bold text-white">₹{pay.amount}</td>
                      <td className="py-3 text-right">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          pay.status === 'SUCCESSFUL' ? 'bg-success/15 text-success' : 'bg-brand-surface-hover text-brand-text-muted'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-brand-text-muted">No transactions audited.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN: BANK PAYOUT WITHDRAWAL
           ========================================== */}
        <aside className="lg:col-span-4 space-y-6">
          <form onSubmit={handleWithdrawEarnings} className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
              <Landmark size={16} />
              <span>Withdraw Payout</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase">Select Bank</label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none"
              >
                <option value="HDFC Bank">HDFC Bank (Ashok Nagar Branch)</option>
                <option value="ICICI Bank">ICICI Bank (MG Road Branch)</option>
                <option value="SBI">State Bank of India</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase">Account Number</label>
              <input
                type="text"
                value={accountNum}
                onChange={e => setAccountNum(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono"
                required
              />
            </div>

            <div className="bg-brand-charcoal p-3 rounded-lg border border-brand-surface-hover text-[10px] text-brand-text-muted leading-relaxed font-mono">
              <div className="flex justify-between border-b border-brand-surface-hover/50 pb-1.5 mb-1.5 font-bold">
                <span>NET EARNINGS:</span>
                <span className="text-white">₹{netEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-brand-surface-hover/50 pb-1.5 mb-1.5 font-bold">
                <span>PAID OUT:</span>
                <span className="text-brand-text-muted">₹{totalPayouts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-brand-surface-hover/50 pb-1.5 mb-1.5 font-bold">
                <span>AVAILABLE CREDIT:</span>
                <span className="text-brand-lime">₹{availableBalance.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-[8px] uppercase tracking-wider text-brand-lime font-sans">Demo payout — no real money transfer occurred.</p>
            </div>

            <button
              type="submit"
              disabled={withdrawing || availableBalance <= 0}
              className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawing ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ArrowUpRight size={14} />
                  <span>Withdraw ₹{availableBalance.toLocaleString()}</span>
                </>
              )}
            </button>
          </form>

          {/* Past Payouts History Card */}
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-lime font-mono">Payout Logs</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {payouts.map(p => (
                <div key={p.id} className="bg-[#0F0F10] border border-brand-surface-hover p-2.5 rounded-xl text-[10px] space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-white">{p.transaction_reference}</span>
                    <span className="text-brand-lime font-bold">₹{p.amount}</span>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-brand-text-muted">
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    <span className="text-success uppercase font-bold">{p.status}</span>
                  </div>
                </div>
              ))}
              {payouts.length === 0 && (
                <p className="text-center text-brand-text-muted py-4 text-[10px]">No payout requests created.</p>
              )}
            </div>
          </div>
        </aside>

      </div>

    </div>
  );
};
