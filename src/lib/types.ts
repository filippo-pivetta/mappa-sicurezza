export interface Regione {
  nome: string;
  imprese_attive: number;
  studi_primario: number | null;
  studi_prim_sec: number | null;
  capitale: number | null;
  persona: number | null;
  sommerso: number | null;
  bands: number[] | null;
  studi_primario_9099: number | null;
  capitale_9099: number | null;
}

export interface RegioniDataset {
  fonte: { studi: string; imprese: string };
  fasce_fatturato: string[];
  regioni: Regione[];
}

export type MetricKey = "densp" | "densps" | "abs" | "pct" | "som";

export interface MetricDef {
  key: MetricKey;
  label: string;
  desc: string;
  value: (d: Regione) => number | null;
  fmt: (v: number) => string;
}
