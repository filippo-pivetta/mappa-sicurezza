import type { MetricDef, Regione } from "../lib/types";
import { metricValues } from "../lib/metrics";

interface Props {
  metric: MetricDef;
  regioni: Regione[];
  selected: string | null;
  onSelect: (nome: string | null) => void;
}

export function RankList({ metric, regioni, selected, onSelect }: Props) {
  const { arr } = metricValues(metric, regioni);
  const filled = arr
    .filter((x): x is { d: Regione; v: number } => x.v != null)
    .sort((a, b) => b.v - a.v);
  const mx = Math.max(...filled.map((x) => x.v), 1);

  return (
    <div className="card rank">
      <div className="blocktitle">Classifica &middot; {metric.label}</div>
      <div>
        {filled.length === 0 ? (
          <div className="dsub">Nessuna regione rilevata.</div>
        ) : (
          filled.map(({ d, v }) => (
            <div
              key={d.nome}
              className={"rrow" + (selected === d.nome ? " sel" : "")}
              onClick={() => onSelect(selected === d.nome ? null : d.nome)}
            >
              <div className="rname">{d.nome}</div>
              <div className="rbarwrap">
                <div className="rbar" style={{ width: `${(v / mx) * 100}%` }} />
              </div>
              <div className="rvv">{metric.fmt(v)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
