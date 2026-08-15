export default function BarChart({ data, color = '#006A4E', height = 140 }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <div className="text-[9.5px] text-text-tertiary font-semibold mb-1">{d.v}</div>
          <div
            className="w-full max-w-[26px] rounded-t-[5px] rounded-b-[2px]"
            style={{ height: `${(d.v / max) * (height - 40)}px`, background: color }}
          />
          <div className="text-[10px] text-text-tertiary mt-1.5">{d.t}</div>
        </div>
      ))}
    </div>
  );
}
