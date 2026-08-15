export default function Sparkline({ series, activeIdx, color = '#006A4E' }) {
  const w = 260, h = 60, pad = 6, max = 100;
  const stepX = (w - pad * 2) / (series.length - 1);
  const pts = series.map((v, i) => [pad + i * stepX, h - pad - (v / max) * (h - pad * 2)]);
  const line = pts.map((p) => p.join(',')).join(' ');
  const area = `${pad},${h - pad} ` + line + ` ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full block" style={{ height: h }}>
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === activeIdx ? 4 : 2.2} fill={i === activeIdx ? color : '#B9C2D0'} />
      ))}
    </svg>
  );
}
