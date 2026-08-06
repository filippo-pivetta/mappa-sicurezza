// Definizione di metrica generica, condivisa dalle pagine "Offerta" e "Domanda":
// entrambe mostrano una scelta di metriche su mappa/classifica con lo stesso
// componente, calcolate su dataset diversi (T) con un eventuale parametro
// extra (E) — lo scope primario/secondario/totale per l'offerta, nessuno per
// la domanda.
export interface MetricDef<T, E = void> {
  key: string;
  label: string;
  desc: string;
  value: (d: T, extra: E) => number | null;
  fmt: (v: number) => string;
}

export interface MetricEntry<T> {
  d: T;
  v: number | null;
}

export function metricValues<T, E>(m: MetricDef<T, E>, items: T[], extra: E) {
  const arr: MetricEntry<T>[] = items.map((d) => ({ d, v: m.value(d, extra) }));
  const nums = arr.filter((x): x is { d: T; v: number } => x.v != null).map((x) => x.v);
  const min = nums.length ? Math.min(...nums) : 0;
  const max = nums.length ? Math.max(...nums) : 1;
  return { arr, min, max };
}
