import { METRICS } from "../lib/metrics";
import type { MetricKey } from "../lib/types";

interface Props {
  metric: MetricKey;
  onChange: (m: MetricKey) => void;
  onTip: (info: { x: number; y: number; title: string; desc: string } | null) => void;
}

export function MetricToggles({ metric, onChange, onTip }: Props) {
  return (
    <div className="toggles">
      {METRICS.map((m) => (
        <button
          key={m.key}
          type="button"
          className={"tg" + (m.key === metric ? " on" : "")}
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
