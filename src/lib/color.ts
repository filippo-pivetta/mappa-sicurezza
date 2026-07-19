// Rampa sequenziale a tinta unica (teal), dal valore piu basso al piu alto.
// Estremo chiaro vicino alla superficie (valore basso), estremo scuro saturo (valore alto).
const LOW: [number, number, number] = [23, 62, 71]; // #173e47
const HIGH: [number, number, number] = [86, 224, 232]; // #56e0e8

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function sequentialColor(t: number): string {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return `rgb(${lerp(LOW[0], HIGH[0], c)}, ${lerp(LOW[1], HIGH[1], c)}, ${lerp(LOW[2], HIGH[2], c)})`;
}

// Restituisce testo chiaro o scuro leggibile sopra il colore risultante per t.
export function textColorFor(t: number): string {
  return t < 0.55 ? "#f2fdff" : "#052026";
}
