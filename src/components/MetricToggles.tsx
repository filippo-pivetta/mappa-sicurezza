import type { MetricDef } from "../lib/metric";

interface Props<T, E> {
  metrics: MetricDef<T, E>[];
  metricKey: string;
  onChange: (k: string) => void;
  onTip: (info: { x: number; y: number; title: string; desc: string } | null) => void;
}

export function MetricToggles<T, E>({ metrics, metricKey, onChange, onTip }: Props<T, E>) {
  return (
    <div className="toggles">
      {metrics.map((m) => (
        <button
          key={m.key}
          type="button"
          className={"tg" + (m.key === metricKey ? " on" : "")}
          onClick={(e) => {
            onChange(m.key);
            const r = e.currentTarget.getBoundingClientRect();
            onTip({ x: r.left, y: r.bottom, title: m.label, desc: m.desc });
          }}
          onMouseMove={(e) => onTip({ x: e.clientX, y: e.clientY, title: m.label, desc: m.desc })}
          onMouseLeave={() => onTip(null)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
