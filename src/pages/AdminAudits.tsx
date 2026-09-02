import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { AuditLog } from '../types';
import { useToast } from '../context/ToastContext';
import { ClipboardList, RefreshCw, Search } from 'lucide-react';

export const AdminAudits: React.FC = () => {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await dbService.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      showToast('Error loading system audits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    return l.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
           l.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-brand-text-muted mt-1">Platform actions monitoring trail for authentication and database transactions</p>
        </div>
        <button onClick={loadAuditLogs}>
          <RefreshCw size={14} className="text-brand-text-muted hover:text-white" />
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={15} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter actor, action, type..."
          className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all font-sans"
        />
      </div>

      <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 shadow-lg overflow-hidden font-sans">
        <div className="overflow-x-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="border-b border-brand-surface-hover/30 skeleton-shimmer h-12 mb-2"></div>
            ))
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-brand-surface-hover text-brand-text-muted uppercase text-[10px] font-mono">
                  <th className="py-2.5">Audit ID</th>
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">Actor</th>
                  <th className="py-2.5">Action</th>
                  <th className="py-2.5">Entity Type</th>
                  <th className="py-2.5 text-right">Details Meta</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-brand-surface-hover/50 text-brand-text-muted hover:text-white transition-colors">
                    <td className="py-3 font-mono text-[10px] text-white">#{log.id.split('-')[0].toUpperCase()}</td>
                    <td className="py-3 font-mono text-[10px]">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 font-bold text-white">{log.actor_name}</td>
                    <td className="py-3">
                      <span className={`text-[8px] font-mono border px-2 py-0.5 rounded font-bold uppercase ${
                        log.action.includes('APPROVE') ? 'bg-success/15 border-success/30 text-success' : log.action.includes('CREATE') ? 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime' : 'bg-brand-surface-hover border-brand-surface text-brand-text-muted'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 uppercase font-mono text-[9px]">{log.entity_type}</td>
                    <td className="py-3 text-right font-mono text-[9px] truncate max-w-[150px]">{JSON.stringify(log.metadata || {})}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-brand-text-muted">No logs recorded.</td>
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
