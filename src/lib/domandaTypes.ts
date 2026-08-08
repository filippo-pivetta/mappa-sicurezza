export interface RegioneDomanda {
  nome: string;
  imprese_con_dipendenti: number;
  addetti: number;
  indice_rischio: number;
  quota_alto_rischio: number;
  risk_mix: { basso: number; medio: number; alto: number };
  settori_imprese: number[];
  settori_addetti: number[];
}

export interface SezioneDef {
  sezione: string;
  nome: string;
}

export interface DomandaDataset {
  fonte: { dati: string; rischio: string };
  sezioni: SezioneDef[];
  regioni: RegioneDomanda[];
}

export type DomandaMetricKey = "imprese" | "addetti" | "rischio" | "alto" | "domandaPesata";
