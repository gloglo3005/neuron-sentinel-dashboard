import { riskColor, riskSoft, riskName } from '../data/zones';

export function RiskBadge({ level, value }) {
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-block"
      style={{ background: riskSoft[level], color: riskColor[level] }}
    >
      {value !== undefined ? `${value}% — ` : ''}{riskName[level]}
    </span>
  );
}

export function Dot({ color }) {
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />;
}

export function Card({ title, subtitle, right, children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-xl2 shadow-card overflow-hidden ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between px-[18px] pt-4 pb-3">
          <div>
            {title && <div className="text-sm font-bold text-text-primary">{title}</div>}
            {subtitle && <div className="text-[11.5px] text-text-tertiary mt-0.5 font-normal">{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div className={title || right ? 'px-[18px] pb-[18px]' : 'p-[18px]'}>{children}</div>
    </div>
  );
}

// Transparent indicator of where a section's data is coming from, per the
// project's rule of never presenting demo data as real (spec section 33).
export function DataSourceBadge({ source, loading }) {
  if (loading) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-border-soft text-text-tertiary">
        Chargement…
      </span>
    );
  }
  if (source === 'real') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-risk-low-soft text-risk-low">
        REAL DATA
      </span>
    );
  }
  if (source === 'mock') {
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-risk-medium-soft text-risk-medium"
        title="Backend non connecté — données de démonstration"
      >
        MOCK
      </span>
    );
  }
  return null;
}

export function Btn({ children, onClick, variant = 'ghost', className = '', disabled = false, ...rest }) {
  const base = 'px-3 py-2 rounded-lg text-[11.5px] font-semibold cursor-pointer transition-opacity hover:opacity-85 whitespace-nowrap';
  const variants = {
    primary: 'bg-brand text-white',
    ghost: 'bg-surface border border-border text-text-secondary',
    amber: 'bg-risk-medium text-white',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className} ${disabled ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
