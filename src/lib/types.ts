import type { MetricDef as GenericMetricDef } from "./metric";

export interface Regione {
  nome: string;
  imprese_con_dipendenti: number;
  numero_addetti: number;
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
  fonte: { studi: string; imprese: string; addetti: string };
  fasce_fatturato: string[];
  regioni: Regione[];
}

export type Scope = "primario" | "secondario" | "totale";

export type MetricKey = "dens" | "abs" | "densAdd" | "pct";

export type MetricDef = GenericMetricDef<Regione, Scope>;
