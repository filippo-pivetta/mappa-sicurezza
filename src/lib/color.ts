// Rampa sequenziale per la densita (offerta): dal teal scuro/muto (valore
// basso) al teal chiaro (valore alto) — --dens-min/--dens-max in index.css.
// Volutamente distinta dal turchese di accento, che resta riservato agli
// elementi interattivi (link, filtri, hover, selezione).
const LOW: [number, number, number] = [36, 96, 110]; // #24606e
const HIGH: [number, number, number] = [110, 230, 238]; // #6ee6ee

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function sequentialColor(t: number): string {
  const c = clamp01(t);
  return `rgb(${lerp(LOW[0], HIGH[0], c)}, ${lerp(LOW[1], HIGH[1], c)}, ${lerp(LOW[2], HIGH[2], c)})`;
}

// Stessa rampa, ma con alpha regolabile — usata per il fondo delle celle
// tabella (micro-heatmap) dove il testo deve restare leggibile sopra.
export function sequentialColorAlpha(t: number, alpha: number): string {
  const c = clamp01(t);
  const [r, g, b] = [lerp(LOW[0], HIGH[0], c), lerp(LOW[1], HIGH[1], c), lerp(LOW[2], HIGH[2], c)];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Restituisce testo chiaro o scuro leggibile sopra il colore risultante per t.
export function textColorFor(t: number): string {
  return t < 0.55 ? "#f2fdff" : "#052026";
}

// Scala categorica del rischio (basso/medio/alto), desaturata per stare bene
// sul fondo scuro. Stessi valori usati da riskbadge/split in App.css: tenere
// in sync se cambiano li.
export const RISK_COLOR: Record<"basso" | "medio" | "alto", string> = {
  basso: "#4fb477",
  medio: "#e0a94a",
  alto: "#e0645a",
};

const RISK_LOW: [number, number, number] = [79, 180, 119]; // #4fb477
const RISK_MID: [number, number, number] = [224, 169, 74]; // #e0a94a
const RISK_HIGH: [number, number, number] = [224, 100, 90]; // #e0645a

// Rampa continua basso -> medio -> alto, per colorare a colpo d'occhio
// grandezze numeriche di rischio (indice di rischio, quota alto rischio)
// che non cadono già in una delle tre categorie discrete.
export function riskGradientColor(t: number): string {
  const c = clamp01(t);
  const [a, b] = c < 0.5 ? [RISK_LOW, RISK_MID] : [RISK_MID, RISK_HIGH];
  const local = c < 0.5 ? c / 0.5 : (c - 0.5) / 0.5;
  return `rgb(${lerp(a[0], b[0], local)}, ${lerp(a[1], b[1], local)}, ${lerp(a[2], b[2], local)})`;
}

// Suddivide un intervallo [min, max] in terzi e restituisce la fascia
// basso/medio/alto del valore — usata per colorare + etichettare grandezze
// di rischio continue (indice di rischio, quota alto rischio) con la stessa
// terna di colori categorici di riskbadge, invece di un colore libero.
export function riskBucket(value: number, min: number, max: number): "basso" | "medio" | "alto" {
  const range = max - min;
  if (range <= 0) return "medio";
  const t = (value - min) / range;
  return t < 1 / 3 ? "basso" : t < 2 / 3 ? "medio" : "alto";
}

export function riskGradientColorAlpha(t: number, alpha: number): string {
  const c = clamp01(t);
  const [a, b] = c < 0.5 ? [RISK_LOW, RISK_MID] : [RISK_MID, RISK_HIGH];
  const local = c < 0.5 ? c / 0.5 : (c - 0.5) / 0.5;
  const [r, g, bl] = [lerp(a[0], b[0], local), lerp(a[1], b[1], local), lerp(a[2], b[2], local)];
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}
