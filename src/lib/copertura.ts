import type { Regione } from "./types";
import type { RegioneDomanda } from "./domandaTypes";
import { domandaPesata } from "./domandaMetrics";

// Cross offerta/domanda: incrocia la densità di studi (copertura) con la
// dimensione della domanda (imprese obbligate) per regione, per individuare
// le combinazioni di mercato presidiato vs spazio bianco. Le soglie sono le
// mediane nazionali delle due grandezze, non medie: più robuste rispetto
// alle regioni outlier per dimensione (es. Lombardia).
export type Quadrante = "presidiato" | "spazioBianco" | "nicchia" | "contenuta";

export const QUADRANTE_LABEL: Record<Quadrante, string> = {
  presidiato: "Presidiato",
  spazioBianco: "Spazio bianco",
  nicchia: "Nicchia densa",
  contenuta: "Domanda contenuta",
};

export const QUADRANTE_DESC: Record<Quadrante, string> = {
  presidiato: "Domanda sopra la mediana nazionale e densità di studi sopra la mediana: mercato già coperto.",
  spazioBianco: "Domanda sopra la mediana nazionale ma densità di studi sotto la mediana: più imprese obbligate per studio presente.",
  nicchia: "Domanda sotto la mediana ma densità sopra la mediana: mercato piccolo, già ben coperto.",
  contenuta: "Domanda e densità entrambe sotto la mediana nazionale.",
};

export interface CoperturaRow {
  nome: string;
  impreseObbligate: number;
  densitaOfferta: number | null;
  indiceRischio: number;
  quotaAltoRischio: number;
  domandaPesata: number;
  quadrante: Quadrante | null;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export function buildCopertura(offertaRegioni: Regione[], domandaRegioni: RegioneDomanda[]) {
  const offertaByName = new Map(offertaRegioni.map((r) => [r.nome, r]));

  const rows: CoperturaRow[] = domandaRegioni.map((d) => {
    const o = offertaByName.get(d.nome);
    const densitaOfferta =
      o && o.studi_primario != null ? (o.studi_primario / o.imprese_con_dipendenti) * 1000 : null;
    return {
      nome: d.nome,
      impreseObbligate: d.imprese_con_dipendenti,
      densitaOfferta,
      indiceRischio: d.indice_rischio,
      quotaAltoRischio: d.quota_alto_rischio,
      domandaPesata: domandaPesata(d),
      quadrante: null,
    };
  });

  const medianDomanda = median(rows.map((r) => r.impreseObbligate));
  const medianDensita = median(rows.filter((r) => r.densitaOfferta != null).map((r) => r.densitaOfferta as number));

  for (const r of rows) {
    if (r.densitaOfferta == null) continue;
    const altaDomanda = r.impreseObbligate >= medianDomanda;
    const altaDensita = r.densitaOfferta >= medianDensita;
    r.quadrante = altaDomanda
      ? altaDensita
        ? "presidiato"
        : "spazioBianco"
      : altaDensita
        ? "nicchia"
        : "contenuta";
  }

  return { rows, medianDomanda, medianDensita };
}
