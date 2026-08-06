import type { MetricDef } from "../lib/metric";
import { metricValues } from "../lib/metric";

interface Props<T extends { nome: string }, E> {
  metric: MetricDef<T, E>;
  regioni: T[];
  extra: E;
  extraLabel?: string;
  selected: string | null;
  onSelect: (nome: string | null) => void;
}

export function RankList<T extends { nome: string }, E>({
  metric,
  regioni,
  extra,
  extraLabel,
  selected,
  onSelect,
}: Props<T, E>) {
  const { arr } = metricValues(metric, regioni, extra);
  const filled = arr.filter((x): x is { d: T; v: number } => x.v != null).sort((a, b) => b.v - a.v);
  const mx = Math.max(...filled.map((x) => x.v), 1);

  return (
    <div className="card rank">
      <div className="blocktitle">
        Classifica &middot; {metric.label}
        {extraLabel && <> &middot; {extraLabel}</>}
      </div>
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
