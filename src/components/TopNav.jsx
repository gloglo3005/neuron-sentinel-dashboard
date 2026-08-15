import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  CIVIL_PROTECTION: 'Coordinateur — ANPC',
  AUTHORITY: 'Agent — Mairie',
  EMERGENCY_SERVICE: 'Équipe terrain — GNSP',
};

function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: (
    <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />
  ), viewBox: '0 0 24 24' },
  { to: '/risk-map', label: 'Risk Map', icon: (
    <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13" />
  )},
  { to: '/alerts', label: 'Alerts', icon: (
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0" />
  )},
  { to: '/ai-predictions', label: 'AI Predictions', icon: (
    <path d="M12 2l2.5 5.5L20 8l-4.5 4 1 6-4.5-3-4.5 3 1-6L4 8l5.5-.5z" />
  )},
  { to: '/environmental-data', label: 'Environmental Data', icon: (
    <path d="M12 2.5c3 3.5 6 7.1 6 11a6 6 0 01-12 0c0-3.9 3-7.5 6-11z" />
  )},
  { to: '/reports', label: 'Reports', icon: (
    <path d="M6 2h9l5 5v15H6zM15 2v5h5M9 13h6M9 17h6" />
  )},
];

export default function TopNav() {
  return (
    <div className="bg-sidebar-bg px-6 h-16 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-7 overflow-x-auto">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center font-display font-extrabold text-[12.5px] text-white flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #006A4E, #12B888)' }}>
            NS
          </div>
          <div className="font-display font-bold text-sm text-white leading-tight whitespace-nowrap">
            Neuron Sentinel
            <span className="block font-body font-normal text-[10px] text-sidebar-text mt-0.5">Flood Early Warning</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-brand text-white' : 'text-sidebar-text hover:bg-white/5 hover:text-[#D7E4DE]'
                }`
              }
            >
              <svg viewBox={item.viewBox || '0 0 24 24'} fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 opacity-90 flex-shrink-0">
                {item.icon}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-1.5 text-[11px] text-sidebar-text pl-3 border-l border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_0_3px_rgba(0,106,78,0.3)]" />
        Système opérationnel
      </div>
    </div>
  );
}

export function TopBar({ title, loc = 'Lomé, Togo' }) {
  const { user, logout } = useAuth();
  return (
    <div className="bg-surface border-b border-border px-7 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-[18px] font-bold">{title}</h1>
        <div className="flex items-center gap-1.5 text-[12.5px] text-text-tertiary mt-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.4" />
          </svg>
          {loc}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-9 h-9 rounded-[9px] border border-border bg-surface flex items-center justify-center relative text-text-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[17px] h-[17px]">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          <span className="absolute -top-1 -right-1 w-[15px] h-[15px] rounded-full bg-risk-high text-white text-[9px] flex items-center justify-center font-bold border-2 border-surface">3</span>
        </button>
        <button className="w-9 h-9 rounded-[9px] border border-border bg-surface flex items-center justify-center text-text-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[17px] h-[17px]">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-display font-bold text-[12.5px]"
               style={{ background: 'linear-gradient(135deg,#12B888,#006A4E)' }}>
            {initialsOf(user?.name) || '?'}
          </div>
          <div>
            <div className="text-[12.5px] font-semibold">{user?.name || 'Utilisateur'}</div>
            <div className="text-[10.5px] text-text-tertiary">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Se déconnecter"
            className="ml-1 w-8 h-8 rounded-[9px] border border-border bg-surface flex items-center justify-center text-text-secondary hover:opacity-80"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[15px] h-[15px]">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
