import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Invoice } from '../types';
import { FileText, Search, Printer, Download, Eye, X, Receipt } from 'lucide-react';

export const OwnerInvoices: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected invoice details modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadInvoices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Invoices method returns enriched list
      const data = await dbService.getInvoices();
      // Filter invoices for bookings on owner's properties
      const filtered = data.filter(inv => inv.booking?.location?.owner_id === user.id);
      setInvoices(filtered);
    } catch (err: any) {
      showToast('Error loading invoices list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [user]);

  const filteredInvoices = invoices.filter(inv => {
    return (
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.booking?.driver?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.booking?.vehicle?.registration_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2">
            <Receipt className="text-brand-lime" size={24} />
            <span>Financial Invoices</span>
          </h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">
            Review completed stays checkout billing and generated driver invoices
          </p>
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={15} />
          <input
            type="text"
            placeholder="Search invoice #, driver name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
          />
        </div>
      </div>

      {/* Invoices Table List */}
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
                  <th className="py-2.5">Invoice #</th>
                  <th className="py-2.5">Driver</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Base Fee</th>
                  <th className="py-2.5">Overstay</th>
                  <th className="py-2.5">Total Amount</th>
                  <th className="py-2.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-brand-surface-hover/30 text-brand-text-muted hover:text-white transition-colors">
                    <td className="py-3 font-mono font-bold text-brand-lime">{inv.invoice_number}</td>
                    <td className="py-3 font-semibold text-white">
                      <span>{inv.booking?.driver?.full_name || 'Driver'}</span>
                      <span className="block text-[8px] font-mono opacity-80 mt-0.5">{inv.booking?.vehicle?.registration_number}</span>
                    </td>
                    <td className="py-3 font-mono">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3 font-mono">₹{inv.base_amount}</td>
                    <td className="py-3 font-mono text-error">₹{inv.overstay_amount}</td>
                    <td className="py-3 font-mono font-bold text-white">₹{inv.total_amount}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="bg-brand-charcoal hover:bg-brand-lime hover:text-black border border-brand-surface-hover px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center space-x-1 float-right"
                      >
                        <Eye size={11} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-brand-text-muted">No invoices found matching queries.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ==========================================
          INVOICE PASS OVERLAY MODAL
         ========================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in text-xs text-brand-text-muted space-y-6 print:bg-white print:text-black print:p-0 print:border-none">
            
            {/* Modal actions (hidden during print) */}
            <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3 print:hidden">
              <span className="text-sm font-bold flex items-center space-x-1 text-white">
                <FileText className="text-brand-lime animate-pulse" size={16} />
                <span>Invoice Bill: {selectedInvoice.invoice_number}</span>
              </span>
              <button 
                type="button" 
                onClick={() => setSelectedInvoice(null)} 
                className="text-brand-text-muted hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Bill Template Body */}
            <div className="space-y-4 print:space-y-6">
              
              {/* Brand Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight font-sans print:text-black">PARKLY</h2>
                  <p className="text-[9px] font-mono tracking-widest text-brand-lime uppercase">Smart Parking Marketplace</p>
                </div>
                <div className="text-right text-[10px] font-mono">
                  <p className="font-bold text-white print:text-black">{selectedInvoice.invoice_number}</p>
                  <p className="opacity-80">Date: {new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Driver & Property summary grid */}
              <div className="grid grid-cols-2 gap-4 border-y border-brand-surface-hover py-4 print:border-black/20">
                <div className="space-y-1">
                  <span className="text-[8px] font-mono uppercase tracking-wider block opacity-75">Customer Details</span>
                  <p className="font-bold text-white print:text-black">{selectedInvoice.booking?.driver?.full_name || 'Driver'}</p>
                  <p className="font-mono text-[9px]">{selectedInvoice.booking?.vehicle?.brand_model}</p>
                  <p className="font-mono text-[9px]">{selectedInvoice.booking?.vehicle?.registration_number}</p>
                </div>
                
                <div className="space-y-1 text-right">
                  <span className="text-[8px] font-mono uppercase tracking-wider block opacity-75">Location / Slot</span>
                  <p className="font-bold text-white print:text-black">{selectedInvoice.booking?.location?.name || 'Property'}</p>
                  <p className="font-mono text-[9px]">Slot: {selectedInvoice.booking?.slot?.slot_number} (Ground)</p>
                  <p className="font-mono text-[9px]">{selectedInvoice.booking?.location?.address.split(',').slice(0, 2).join(',')}</p>
                </div>
              </div>

              {/* Timing slots */}
              <div className="bg-brand-charcoal/50 border border-brand-surface-hover p-3 rounded-xl space-y-1.5 font-mono text-[10px] print:bg-gray-100 print:text-black print:border-black/10">
                <div className="flex justify-between">
                  <span>Entry Time:</span>
                  <span className="text-white print:text-black">{new Date(selectedInvoice.booking?.start_time || '').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exit Time:</span>
                  <span className="text-white print:text-black">{new Date(selectedInvoice.booking?.end_time || '').toLocaleString()}</span>
                </div>
              </div>

              {/* Receipt balance details */}
              <div className="space-y-2">
                <span className="text-[8px] font-mono uppercase tracking-wider block opacity-75 border-b border-brand-surface-hover pb-1 print:border-black/20">Billing Summary</span>
                
                <div className="flex justify-between text-xs font-mono py-1">
                  <span>Base Booking Charge</span>
                  <span className="text-white print:text-black">₹{selectedInvoice.base_amount}</span>
                </div>
                <div className="flex justify-between text-xs font-mono py-1">
                  <span>Overstay Additional Penalty</span>
                  <span className="text-error print:text-black">₹{selectedInvoice.overstay_amount}</span>
                </div>

                <div className="flex justify-between text-sm font-mono font-bold text-white border-t border-brand-surface-hover pt-2.5 print:text-black print:border-black/20">
                  <span>TOTAL AMOUNT PAID</span>
                  <span className="text-brand-lime print:text-black">₹{selectedInvoice.total_amount}</span>
                </div>
              </div>

              {/* Footer notice */}
              <div className="text-center text-[9px] pt-4 opacity-75">
                <p>Thank you for parking with Parkly.</p>
                <p className="font-mono mt-1 text-brand-lime uppercase tracking-wider print:text-black">DEMO RECEIPT — NO REAL CASH TRANSFER</p>
              </div>

            </div>

            {/* Print and Download Actions (hidden during printing) */}
            <div className="flex space-x-2 pt-4 border-t border-brand-surface-hover print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(132,204,22,0.1)]"
              >
                <Printer size={13} />
                <span>Print Bill</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('PDF invoice downloaded successfully.', 'success');
                }}
                className="flex-1 bg-brand-charcoal hover:bg-brand-surface-hover border border-brand-surface-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
