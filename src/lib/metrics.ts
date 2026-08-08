import type { MetricDef, Regione, Scope } from "./types";

export { metricValues } from "./metric";

export const SCOPES: { key: Scope; label: string; short: string }[] = [
  { key: "primario", label: "Solo attività primaria", short: "Primario" },
  { key: "secondario", label: "Solo attività secondaria", short: "Secondario" },
  { key: "totale", label: "Primario + secondario", short: "Primario + Secondario" },
];

/** Numero di studi nella regione secondo lo scope scelto (primario / secondario / totale). */
export function studiCount(d: Regione, scope: Scope): number | null {
  if (d.studi_primario == null) return null;
  if (scope === "primario") return d.studi_primario;
  if (scope === "secondario") return d.sommerso;
  return d.studi_prim_sec;
}

export const METRICS: MetricDef[] = [
  {
    key: "dens",
    label: "Densità",
    desc: "Studi ogni 1.000 imprese con dipendenti della regione, secondo il filtro primario/secondario/totale scelto sopra. Valore alto significa mercato affollato, valore basso significa più spazio potenziale.",
    value: (d, scope) => {
      const c = studiCount(d, scope);
      return c == null ? null : (c / d.imprese_con_dipendenti) * 1000;
    },
    fmt: (v) => v.toFixed(2),
  },
  {
    key: "abs",
    label: "Numero studi",
    desc: "Numero assoluto di studi nella regione, secondo il filtro primario/secondario/totale scelto sopra. Segue la dimensione economica della regione, non la copertura.",
    value: (d, scope) => studiCount(d, scope),
    fmt: (v) => Math.round(v).toLocaleString("it"),
  },
  {
    key: "pct",
    label: "% società di capitale",
    desc: "Quota di studi con attività PRIMARIA che sono società di capitale (SRL, SpA), cioè con bilancio pubblico. Il resto sono ditte individuali e società di persone, opache. Il dato di composizione è disponibile solo per l'attività primaria, non varia con il filtro sopra.",
    value: (d) => (d.studi_primario == null || d.capitale == null ? null : (d.capitale / d.studi_primario) * 100),
    fmt: (v) => v.toFixed(0) + "%",
  },
  {
    key: "densAdd",
    label: "Densità per addetti",
    desc: "Studi ogni 1.000 addetti (lavoratori) della regione, secondo il filtro primario/secondario/totale scelto sopra. A differenza della densità per imprese, misura la copertura rispetto alle persone da tutelare, non alle aziende.",
    value: (d, scope) => {
      const c = studiCount(d, scope);
      return c == null ? null : (c / d.numero_addetti) * 1000;
    },
    fmt: (v) => v.toFixed(2),
  },
];

// Punto medio di ciascuna fascia di fatturato (stesso ordine di
// fasce_fatturato in regioni.json). L'ultima fascia è aperta (">5M€"): 8M è
// un'ipotesi centrale, poco sensibile sul totale visto il numero ridotto di
// studi in quella fascia (+/-15% del totale tra 5,5M e 15M di ipotesi).
const FASCIA_FATTURATO_MIDPOINT = [
  5_000, 12_500, 20_000, 37_500, 62_500, 87_500, 125_000, 325_000, 1_000_000, 3_250_000, 8_000_000,
];

export interface StimaFatturato {
  totale: number;
  nStudi: number;
  mediaPerStudio: number;
}

/**
 * Stima il fatturato aggregato a partire dai conteggi per fascia (bands),
 * moltiplicando ogni fascia per il suo punto medio. Copre solo le società di
 * capitale con bilancio depositato e classificabile in fascia — non le ditte
 * individuali/società di persone (senza bilancio pubblico) né gli operatori
 * secondari: è quindi una stima per difetto del fatturato reale del settore.
 */
export function stimaFatturato(bands: number[]): StimaFatturato {
  const totale = bands.reduce((s, n, i) => s + n * (FASCIA_FATTURATO_MIDPOINT[i] ?? 0), 0);
  const nStudi = bands.reduce((s, n) => s + n, 0);
  return { totale, nStudi, mediaPerStudio: nStudi > 0 ? totale / nStudi : 0 };
}

export function nationalAggregate(regioni: Regione[]): Regione {
  const f = regioni.filter((d) => d.studi_primario != null);
  const sumStudi = (k: "imprese_con_dipendenti" | "studi_primario" | "studi_prim_sec" | "capitale" | "persona" | "sommerso") =>
    f.reduce((s, d) => s + (d[k] as number), 0);
  const nBands = f[0]?.bands?.length ?? 11;
  const bands = Array.from({ length: nBands }, (_, i) => f.reduce((s, d) => s + (d.bands ? d.bands[i] : 0), 0));

  const addettiTotali = regioni.reduce((s, d) => s + d.numero_addetti, 0);

  return {
    nome: `Italia · ${f.length} regioni rilevate`,
    imprese_con_dipendenti: sumStudi("imprese_con_dipendenti"),
    numero_addetti: addettiTotali,
    studi_primario: sumStudi("studi_primario"),
    studi_prim_sec: sumStudi("studi_prim_sec"),
    capitale: sumStudi("capitale"),
    persona: sumStudi("persona"),
    sommerso: sumStudi("sommerso"),
    bands,
    studi_primario_9099: null,
    capitale_9099: null,
  };
}
