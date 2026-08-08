import type { ReactNode } from "react";

interface Props {
  value: number;
  max: number;
  min?: number;
  formatted: ReactNode;
  /** Colore pieno della barra. Passare un colore fisso (es. "var(--accent)") per
   *  una scala sequenziale a tinta unica, o un colore calcolato per riga (es.
   *  riskGradientColor(t)) per far variare anche la tinta — l'effetto heatmap. */
  color: string;
  /** Opacita di riempimento della barra; 25% di default. */
  fillOpacity?: number;
}

/** Numero in tabella con una micro-barra proporzionale dietro, per far scandire
 * una colonna come una forma invece che cifra per cifra. */
export function BarCell({ value, max, min = 0, formatted, color, fillOpacity = 0.25 }: Props) {
  const range = max - min;
  const t = range > 0 ? Math.max(0, Math.min(1, (value - min) / range)) : 0;
  const widthPct = value > 0 ? Math.max(3, t * 100) : 0;
  const opacity = fillOpacity;
  return (
    <div className="barcell">
      <div className="barfill" style={{ width: `${widthPct}%`, background: color, opacity }} aria-hidden />
      <span className="barval">{formatted}</span>
    </div>
  );
}
