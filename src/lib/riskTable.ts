// Tabella di rischio per sezione ATECO secondo l'Accordo Stato-Regioni: la
// classificazione di riferimento dietro l'indice di rischio e la quota alto
// rischio della pagina Domanda (peso basso=1, medio=2, alto=3).
export interface RiskRow {
  sezione: string;
  descrizione: string;
  rischio: "basso" | "medio" | "alto";
  peso: 1 | 2 | 3;
}

export const RISK_TABLE: RiskRow[] = [
  { sezione: "A", descrizione: "Agricoltura, silvicoltura e pesca", rischio: "medio", peso: 2 },
  { sezione: "B", descrizione: "Estrazione di minerali da cave e miniere", rischio: "alto", peso: 3 },
  { sezione: "C", descrizione: "Attività manifatturiere", rischio: "alto", peso: 3 },
  {
    sezione: "D",
    descrizione: "Fornitura di energia elettrica, gas, vapore e aria condizionata",
    rischio: "alto",
    peso: 3,
  },
  {
    sezione: "E",
    descrizione: "Fornitura di acqua; reti fognarie, gestione rifiuti e risanamento",
    rischio: "alto",
    peso: 3,
  },
  { sezione: "F", descrizione: "Costruzioni", rischio: "alto", peso: 3 },
  {
    sezione: "G",
    descrizione: "Commercio all'ingrosso e al dettaglio; riparazione di autoveicoli e motocicli",
    rischio: "basso",
    peso: 1,
  },
  { sezione: "H", descrizione: "Trasporto e magazzinaggio", rischio: "medio", peso: 2 },
  {
    sezione: "I",
    descrizione: "Attività dei servizi di alloggio e di ristorazione",
    rischio: "basso",
    peso: 1,
  },
  { sezione: "J", descrizione: "Servizi di informazione e comunicazione", rischio: "basso", peso: 1 },
  { sezione: "K", descrizione: "Attività finanziarie e assicurative", rischio: "basso", peso: 1 },
  { sezione: "L", descrizione: "Attività immobiliari", rischio: "basso", peso: 1 },
  {
    sezione: "M",
    descrizione: "Attività professionali, scientifiche e tecniche",
    rischio: "basso",
    peso: 1,
  },
  {
    sezione: "N",
    descrizione: "Noleggio, agenzie di viaggio, servizi di supporto alle imprese",
    rischio: "basso",
    peso: 1,
  },
  {
    sezione: "O",
    descrizione: "Amministrazione pubblica e difesa; assicurazione sociale obbligatoria",
    rischio: "medio",
    peso: 2,
  },
  { sezione: "P", descrizione: "Istruzione", rischio: "medio", peso: 2 },
  { sezione: "Q", descrizione: "Sanità e assistenza sociale", rischio: "alto", peso: 3 },
  {
    sezione: "R",
    descrizione: "Attività artistiche, sportive, di intrattenimento e divertimento",
    rischio: "basso",
    peso: 1,
  },
  { sezione: "S", descrizione: "Altre attività di servizi", rischio: "basso", peso: 1 },
  {
    sezione: "T",
    descrizione: "Attività di famiglie e convivenze come datori di lavoro per personale domestico",
    rischio: "basso",
    peso: 1,
  },
  { sezione: "U", descrizione: "Organizzazioni ed organismi extraterritoriali", rischio: "basso", peso: 1 },
];
