import type { MetricDef, Regione } from "./types";

export const METRICS: MetricDef[] = [
  {
    key: "densp",
    label: "Densità primario",
    desc: "Studi con la sicurezza come attività PRINCIPALE, ogni 1.000 imprese con dipendenti della regione. Valore alto significa mercato affollato, valore basso significa più spazio potenziale.",
    value: (d) => (d.studi_primario == null ? null : (d.studi_primario / d.imprese_con_dipendenti) * 1000),
    fmt: (v) => v.toFixed(2),
  },
  {
    key: "densps",
    label: "Densità prim+sec",
    desc: "Come la densità primario, ma includendo anche gli studi che fanno sicurezza come attività SECONDARIA. Misura la copertura del mercato allargato.",
    value: (d) => (d.studi_prim_sec == null ? null : (d.studi_prim_sec / d.imprese_con_dipendenti) * 1000),
    fmt: (v) => v.toFixed(2),
  },
  {
    key: "abs",
    label: "Numero studi",
    desc: "Numero assoluto di studi con la sicurezza come attività principale nella regione. Segue la dimensione economica della regione, non la copertura.",
    value: (d) => d.studi_primario,
    fmt: (v) => Math.round(v).toLocaleString("it"),
  },
  {
    key: "pct",
    label: "% società di capitale",
    desc: "Quota di studi che sono società di capitale (SRL, SpA), cioè con bilancio pubblico. Il resto sono ditte individuali e società di persone, opache.",
    value: (d) => (d.studi_primario == null || d.capitale == null ? null : (d.capitale / d.studi_primario) * 100),
    fmt: (v) => v.toFixed(0) + "%",
  },
  {
    key: "som",
    label: "Sommerso",
    desc: "Studi in più che emergono includendo l'attività secondaria: operatori che fanno sicurezza pur essendo iscritti primariamente sotto un altro codice.",
    value: (d) => d.sommerso,
    fmt: (v) => Math.round(v).toLocaleString("it"),
  },
  {
    key: "densp_add",
    label: "Densità per addetti",
    desc: "Studi con sicurezza come attività principale ogni 1.000 addetti (lavoratori) della regione. A differenza della densità per imprese, misura la copertura rispetto alle persone da tutelare, non alle aziende.",
    value: (d) => (d.studi_primario == null ? null : (d.studi_primario / d.numero_addetti) * 1000),
    fmt: (v) => v.toFixed(2),
  },
  {
    key: "densps_add",
    label: "Densità prim+sec per addetti",
    desc: "Come la densità per addetti, ma includendo anche gli studi che fanno sicurezza come attività secondaria.",
    value: (d) => (d.studi_prim_sec == null ? null : (d.studi_prim_sec / d.numero_addetti) * 1000),
    fmt: (v) => v.toFixed(2),
  },
  {
    key: "rischio",
    label: "Indice rischio settoriale",
    desc: "Media dei pesi di rischio D.Lgs. 81/08 (basso 1, medio 2, alto 3) pesata sul mix settoriale reale della regione. Non dipende dai dati Telemaco: disponibile per tutte le regioni, anche quelle non ancora rilevate.",
    value: (d) => d.indice_rischio,
    fmt: (v) => v.toFixed(2),
  },
  {
    key: "domanda",
    label: "Domanda pesata",
    desc: "Imprese con dipendenti moltiplicate per l'indice di rischio settoriale: stima della domanda potenziale di consulenza sicurezza, pesata per la rischiosità del tessuto produttivo regionale. Disponibile per tutte le regioni, anche quelle non ancora rilevate su Telemaco.",
    value: (d) => d.domanda_pesata,
    fmt: (v) => Math.round(v).toLocaleString("it"),
  },
];

export function metricValues(m: MetricDef, regioni: Regione[]) {
  const arr = regioni.map((d) => ({ d, v: m.value(d) }));
  const nums = arr.filter((x): x is { d: Regione; v: number } => x.v != null).map((x) => x.v);
  const min = nums.length ? Math.min(...nums) : 0;
  const max = nums.length ? Math.max(...nums) : 1;
  return { arr, min, max };
}

export function nationalAggregate(regioni: Regione[]): Regione {
  const f = regioni.filter((d) => d.studi_primario != null);
  const sumStudi = (k: "imprese_con_dipendenti" | "studi_primario" | "studi_prim_sec" | "capitale" | "persona" | "sommerso") =>
    f.reduce((s, d) => s + (d[k] as number), 0);
  const nBands = f[0]?.bands?.length ?? 11;
  const bands = Array.from({ length: nBands }, (_, i) => f.reduce((s, d) => s + (d.bands ? d.bands[i] : 0), 0));

  // indice_rischio e domanda_pesata non dipendono da Telemaco: aggregali su tutte le regioni.
  const impreseTotali = regioni.reduce((s, d) => s + d.imprese_con_dipendenti, 0);
  const addettiTotali = regioni.reduce((s, d) => s + d.numero_addetti, 0);
  const domandaTotale = regioni.reduce((s, d) => s + d.domanda_pesata, 0);
  const indiceMedio = impreseTotali > 0 ? domandaTotale / impreseTotali : 0;

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
    indice_rischio: indiceMedio,
    domanda_pesata: domandaTotale,
  };
}
