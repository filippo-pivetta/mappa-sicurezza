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
  /** Distribuzione nazionale per fascia di fatturato, primario + secondario
   * incluso (studi con la sicurezza come attività secondaria compresi) —
   * stesso ordine di fasce_fatturato. A differenza di Regione.bands (solo
   * attività primaria, per regione), è un totale Italia non scomposto per
   * regione. */
  bands_totale_nazionale?: number[];
  /** Nuovi studi (primario + secondario) nati per anno, chiave = anno come stringa.
   * Nazionale, non scomposto per regione. L'anno corrente è tipicamente parziale. */
  nuovi_studi_per_anno?: Record<string, number>;
  /** Studi (primario + secondario) per coorte di anno di fondazione, attorno alla
   * finestra "in transizione generazionale" — titolari oggi in fascia di
   * pensionamento. `target: true` marca la coorte al centro dell'analisi
   * (anni '90 - inizio 2000); le altre sono contesto (coorte precedente/successiva). */
  transizione_generazionale?: { coorti: { dal: number; al: number; studi: number; target?: boolean }[] };
  regioni: Regione[];
}

export type Scope = "primario" | "secondario" | "totale";

export type MetricKey = "dens" | "abs" | "densAdd" | "pct";

export type MetricDef = GenericMetricDef<Regione, Scope>;
