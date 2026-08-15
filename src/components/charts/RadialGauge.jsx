export default function RadialGauge({ value, color = '#6C5CE7', size = 140 }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E6EAF1" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 7} textAnchor="middle" fontFamily="Manrope" fontWeight="800" fontSize="22" fill="#141B2C">
        {value}%
      </text>
    </svg>
  );
}
