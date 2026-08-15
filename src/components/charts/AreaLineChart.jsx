export default function AreaLineChart({
  series, color = '#006A4E', width = 400, height = 150, max = 100, min = 0,
  secondSeries = null, secondColor = '#1E9E5A', gradientId = 'areaGrad',
}) {
  const pad = 10;
  const stepX = (width - pad * 2) / (series.length - 1);
  const y = (v) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);
  const line = (arr) => arr.map((v, i) => `${pad + i * stepX},${y(v)}`).join(' ');
  const areaPts = (arr) => `${pad},${height - pad} ` + line(arr) + ` ${width - pad},${height - pad}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#E6EAF1" strokeWidth="1" />
      <polygon points={areaPts(series)} fill={`url(#${gradientId})`} />
      <polyline points={line(series)} fill="none" stroke={color} strokeWidth="2.2" />
      {secondSeries && (
        <polyline points={line(secondSeries)} fill="none" stroke={secondColor} strokeWidth="2" strokeDasharray="4 3" />
      )}
      {series.map((v, i) => (
        <circle key={i} cx={pad + i * stepX} cy={y(v)} r={i === series.length - 1 ? 3.5 : 1.8} fill={color} />
      ))}
    </svg>
  );
}
