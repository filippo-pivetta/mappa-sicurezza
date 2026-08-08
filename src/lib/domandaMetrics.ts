import type { MetricDef } from "./metric";
import type { RegioneDomanda } from "./domandaTypes";

/** Imprese obbligate moltiplicate per l'indice di rischio: stima della domanda potenziale pesata per la rischiosità del tessuto produttivo regionale. */
export function domandaPesata(d: RegioneDomanda): number {
  return d.imprese_con_dipendenti * d.indice_rischio;
}

export const DOMANDA_METRICS: MetricDef<RegioneDomanda, void>[] = [
  {
    key: "imprese",
    label: "Imprese obbligate",
    desc: "Imprese con dipendenti nella regione: sono gli obbligati D.Lgs 81/08, il mercato potenziale della consulenza sicurezza. Segue la dimensione economica della regione.",
    value: (d) => d.imprese_con_dipendenti,
    fmt: (v) => Math.round(v).toLocaleString("it"),
  },
  {
    key: "addetti",
    label: "Addetti",
    desc: "Lavoratori totali nelle imprese con dipendenti della regione: le persone da tutelare, dato ISTAT ASIA 2024.",
    value: (d) => d.addetti,
    fmt: (v) => Math.round(v).toLocaleString("it"),
  },
  {
    key: "rischio",
    label: "Indice di rischio",
    desc: "Media dei pesi di rischio (basso 1, medio 2, alto 3) secondo l'Accordo Stato-Regioni, pesata sul mix settoriale reale delle imprese con dipendenti della regione. Più alto, più rischioso il tessuto produttivo.",
    value: (d) => d.indice_rischio,
    fmt: (v) => v.toFixed(2),
  },
  {
    key: "alto",
    label: "Quota alto rischio",
    desc: "Quota di imprese con dipendenti che opera in settori classificati a rischio ALTO secondo l'Accordo Stato-Regioni.",
    value: (d) => d.quota_alto_rischio,
    fmt: (v) => v.toFixed(0) + "%",
  },
  {
    key: "domandaPesata",
    label: "Domanda pesata",
    desc: "Imprese con dipendenti moltiplicate per l'indice di rischio: stima della domanda potenziale di consulenza sicurezza, pesata per la rischiosità del tessuto produttivo regionale.",
    value: (d) => domandaPesata(d),
    fmt: (v) => Math.round(v).toLocaleString("it"),
  },
];

export function nationalAggregateDomanda(regioni: RegioneDomanda[]): RegioneDomanda {
  const impreseTot = regioni.reduce((s, d) => s + d.imprese_con_dipendenti, 0);
  const addettiTot = regioni.reduce((s, d) => s + d.addetti, 0);
  const risk_mix = { basso: 0, medio: 0, alto: 0 };
  let weightedRiskSum = 0;
  const nSettori = regioni[0]?.settori_imprese.length ?? 0;
  const settori_imprese = Array.from({ length: nSettori }, (_, i) =>
    regioni.reduce((s, d) => s + (d.settori_imprese[i] ?? 0), 0),
  );
  const settori_addetti = Array.from({ length: nSettori }, (_, i) =>
    regioni.reduce((s, d) => s + (d.settori_addetti[i] ?? 0), 0),
  );

  for (const d of regioni) {
    risk_mix.basso += d.risk_mix.basso;
    risk_mix.medio += d.risk_mix.medio;
    risk_mix.alto += d.risk_mix.alto;
    weightedRiskSum += d.indice_rischio * d.imprese_con_dipendenti;
  }

  return {
    nome: `Italia · ${regioni.length} regioni`,
    imprese_con_dipendenti: impreseTot,
    addetti: addettiTot,
    indice_rischio: impreseTot > 0 ? weightedRiskSum / impreseTot : 0,
    quota_alto_rischio: impreseTot > 0 ? (risk_mix.alto / impreseTot) * 100 : 0,
    risk_mix,
    settori_imprese,
    settori_addetti,
  };
}
