import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AccessLog, ParkingLocation } from '../types';
import { FileSpreadsheet, Search, Filter, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export const OwnerAccessLogs: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocId, setSelectedLocId] = useState('ALL');
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  const loadProperties = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await dbService.getParkingLocations('OWNER', user.id);
      const approved = data.filter(l => l.status === 'APPROVED');
      setLocations(approved);
    } catch (err: any) {
      showToast('Error loading properties.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Get access logs for all owner locations
      const locIds = selectedLocId === 'ALL' 
        ? locations.map(l => l.id) 
        : [selectedLocId];

      let allLogs: AccessLog[] = [];
      for (const id of locIds) {
        const itemLogs = await dbService.getAccessLogs(id);
        allLogs = [...allLogs, ...itemLogs];
      }

      setLogs(allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err: any) {
      showToast('Error loading access history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  useEffect(() => {
    if (locations.length > 0 || selectedLocId !== 'ALL') {
      loadLogs();
    }
  }, [locations, selectedLocId]);

  // Filter Pipeline
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.plate_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.rfid_uid?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.reason?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesMethod = methodFilter === 'ALL' ? true : log.method === methodFilter;
    const matchesEvent = eventFilter === 'ALL' ? true : log.event_type === eventFilter;
    const matchesResult = resultFilter === 'ALL' ? true : log.result === resultFilter;

    return matchesSearch && matchesMethod && matchesEvent && matchesResult;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="text-brand-lime" size={24} />
            <span>Smart Access Audit Logs</span>
          </h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">
            Audit automatic vehicle arrivals and exits across gate terminals
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="bg-brand-charcoal hover:bg-brand-surface-hover border border-brand-surface-hover text-white p-2 rounded-lg"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-brand-surface border border-brand-surface-hover p-4 rounded-2xl flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={14} />
            <input
              type="text"
              placeholder="Search plate, RFID tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-9 pr-3 py-2 outline-none text-white font-sans"
            />
          </div>

          {/* Location filter */}
          <div className="flex items-center space-x-1 bg-brand-charcoal/30 border border-brand-surface-hover px-2.5 py-1.5 rounded-lg">
            <Filter size={12} className="text-brand-lime shrink-0" />
            <select
              value={selectedLocId}
              onChange={e => setSelectedLocId(e.target.value)}
              className="w-full bg-transparent outline-none text-white font-semibold"
            >
              <option value="ALL">All Properties</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div className="flex items-center space-x-1 bg-brand-charcoal/30 border border-brand-surface-hover px-2.5 py-1.5 rounded-lg">
            <Filter size={12} className="text-brand-lime shrink-0" />
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full bg-transparent outline-none text-white font-semibold"
            >
              <option value="ALL">All Methods</option>
              <option value="ANPR">ANPR Camera</option>
              <option value="QR">QR Scanner</option>
              <option value="RFID">RFID Card</option>
              <option value="MANUAL">Manual Console</option>
            </select>
          </div>

          {/* Event Filter */}
          <div className="flex items-center space-x-1 bg-brand-charcoal/30 border border-brand-surface-hover px-2.5 py-1.5 rounded-lg">
            <Filter size={12} className="text-brand-lime shrink-0" />
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              className="w-full bg-transparent outline-none text-white font-semibold"
            >
              <option value="ALL">All Events</option>
              <option value="ENTRY">ENTRY (Arrival)</option>
              <option value="EXIT">EXIT (Departure)</option>
            </select>
          </div>

          {/* Result Filter */}
          <div className="flex items-center space-x-1 bg-brand-charcoal/30 border border-brand-surface-hover px-2.5 py-1.5 rounded-lg">
            <Filter size={12} className="text-brand-lime shrink-0" />
            <select
              value={resultFilter}
              onChange={e => setResultFilter(e.target.value)}
              className="w-full bg-transparent outline-none text-white font-semibold"
            >
              <option value="ALL">All Results</option>
              <option value="GRANTED">GRANTED</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>

        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="border-b border-brand-surface-hover/30 skeleton-shimmer h-12 mb-2"></div>
            ))
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-brand-surface-hover text-brand-text-muted uppercase text-[10px] font-mono">
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">Location</th>
                  <th className="py-2.5">Identifier</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5">Event</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const locName = locations.find(l => l.id === log.location_id)?.name || 'Property';
                  return (
                    <tr key={log.id} className="border-b border-brand-surface-hover/30 text-brand-text-muted hover:text-white transition-colors">
                      <td className="py-3 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 font-semibold text-white">{locName}</td>
                      <td className="py-3 font-mono font-bold">{log.plate_number || log.rfid_uid || 'N/A'}</td>
                      <td className="py-3 font-mono text-[10px]">{log.method}</td>
                      <td className="py-3 font-bold">{log.event_type}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[8px] border flex items-center space-x-1 w-max ${
                          log.result === 'GRANTED' 
                            ? 'bg-success/15 border-success/20 text-success' 
                            : 'bg-error/15 border-error/20 text-error'
                        }`}>
                          {log.result === 'GRANTED' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          <span>{log.result}</span>
                        </span>
                      </td>
                      <td className="py-3 text-right text-[10px] italic font-sans max-w-xs truncate">{log.reason || 'Verified'}</td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-brand-text-muted">No entry logs found matching filters.</td>
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
