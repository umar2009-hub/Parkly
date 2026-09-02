import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, Compass, Calendar, Heart, User, Settings, Building, AlertCircle } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Command palette options
  const defaultActions = [
    { name: 'Find Parking Slots', path: '/app/find', icon: Compass, roles: ['DRIVER', 'OWNER', 'ADMIN'] },
    { name: 'My Bookings Pass', path: '/app/bookings', icon: Calendar, roles: ['DRIVER'] },
    { name: 'Saved Favorites', path: '/app/favorites', icon: Heart, roles: ['DRIVER'] },
    { name: 'Profile Garage', path: '/app/profile', icon: User, roles: ['DRIVER'] },
    { name: 'Account Settings', path: '/app/settings', icon: Settings, roles: ['DRIVER', 'OWNER', 'ADMIN'] },
    { name: 'List Parking Space', path: '/owner/parking', icon: Building, roles: ['OWNER'] },
    { name: 'Real-time Occupancy Console', path: '/owner/slots', icon: Settings, roles: ['OWNER'] },
    { name: 'Admin Approvals Queue', path: '/admin/parking', icon: Building, roles: ['ADMIN'] },
  ];

  // Filter actions based on search and user role
  const activeActions = defaultActions.filter(act => {
    const matchesRole = user ? act.roles.includes(user.role) : true;
    const matchesSearch = act.name.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setActiveIndex(0);
      }
      
      // Close on Esc
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard list navigation
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % activeActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + activeActions.length) % activeActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeActions[activeIndex]) {
        handleTriggerAction(activeActions[activeIndex].path);
      }
    }
  };

  const handleTriggerAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
    showToast(`Navigated via Command Launcher`, 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-fade-in">
      <div 
        ref={containerRef}
        className="bg-brand-surface border border-brand-lime/30 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(132,204,22,0.1)] overflow-hidden animate-slide-up"
      >
        {/* Search header */}
        <div className="p-4 border-b border-brand-surface-hover flex items-center space-x-3">
          <Search className="text-brand-lime" size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or shortcut... (e.g. Find Parking)"
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleListKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder-brand-text-muted outline-none"
          />
          <span className="text-[10px] bg-brand-charcoal border border-brand-surface-hover px-1.5 py-0.5 rounded font-mono text-brand-text-muted">ESC</span>
        </div>

        {/* List area */}
        <div className="max-h-60 overflow-y-auto py-2">
          {activeActions.length === 0 ? (
            <div className="p-4 text-center text-xs text-brand-text-muted flex flex-col items-center space-y-1">
              <AlertCircle size={16} />
              <span>No commands match your filter query.</span>
            </div>
          ) : (
            activeActions.map((act, index) => {
              const isFocused = index === activeIndex;
              return (
                <button
                  key={act.name}
                  onClick={() => handleTriggerAction(act.path)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full text-left px-4 py-2.5 text-xs flex items-center space-x-3 transition-colors ${
                    isFocused 
                      ? 'bg-brand-lime text-black font-bold' 
                      : 'text-brand-text-muted hover:text-white'
                  }`}
                >
                  <act.icon size={15} className={isFocused ? 'text-black' : 'text-brand-lime'} />
                  <span className="flex-1">{act.name}</span>
                  {isFocused && (
                    <span className="text-[9px] font-mono border border-black/20 px-1.5 py-0.25 rounded font-bold uppercase">
                      Enter
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="bg-[#0F0F10] border-t border-brand-surface-hover px-4 py-2.5 flex justify-between text-[9px] font-mono text-brand-text-muted uppercase">
          <span>Arrows to navigate</span>
          <span>Enter to execute</span>
        </div>

      </div>
    </div>
  );
};
