import { REGION_ABBR } from "../lib/regionAbbr";
import { riskGradientColor } from "../lib/color";
import type { CoperturaRow, Quadrante } from "../lib/copertura";

const WIDTH = 640;
const HEIGHT = 420;
const MARGIN = { top: 16, right: 20, bottom: 42, left: 54 };
const R_MIN = 5;
const R_MAX = 15;

export const QUADRANTE_COLOR: Record<Quadrante, string> = {
  presidiato: "#37c0c8",
  spazioBianco: "#e0a94a",
  nicchia: "#8a7fd9",
  contenuta: "#5c7186",
};

const X_CANDIDATES = [2000, 5000, 10000, 20000, 50000, 100000, 200000, 300000];
const Y_CANDIDATES = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];

function formatK(v: number): string {
  return v >= 1000 ? Math.round(v / 1000).toLocaleString("it") + "k" : Math.round(v).toString();
}

export interface QuadrantHover {
  row: CoperturaRow;
  x: number;
  y: number;
}

interface Props {
  rows: CoperturaRow[];
  medianDomanda: number;
  medianDensita: number;
  selected: string | null;
  onSelect: (nome: string | null) => void;
  onHover?: (info: QuadrantHover | null) => void;
}

export function QuadrantChart({ rows, medianDomanda, medianDensita, selected, onSelect, onHover }: Props) {
  const plotted = rows.filter((r): r is CoperturaRow & { densitaOfferta: number } => r.densitaOfferta != null);
  if (plotted.length === 0) return null;

  const xs = plotted.map((r) => Math.log10(r.impreseObbligate));
  const ys = plotted.map((r) => r.densitaOfferta);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xPad = (xMax - xMin) * 0.1 || 0.2;
  const yPad = (yMax - yMin) * 0.14 || 0.3;
  const x0 = xMin - xPad;
  const x1 = xMax + xPad;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const xPix = (v: number) => MARGIN.left + ((Math.log10(v) - x0) / (x1 - x0)) * plotW;
  const yPix = (v: number) => MARGIN.top + (1 - (v - y0) / (y1 - y0)) * plotH;

  const xMedPix = xPix(medianDomanda);
  const yMedPix = yPix(medianDensita);
  const xTicks = X_CANDIDATES.filter((t) => t >= 10 ** x0 && t <= 10 ** x1);
  const yTicks = Y_CANDIDATES.filter((t) => t >= y0 && t <= y1);

  // Raggio del punto proporzionale al numero di studi (area, non diametro:
  // scala su radice quadrata cosi le differenze non vengono esagerate).
  const studiVals = plotted.map((r) => r.studiPrimario ?? 0);
  const studiMin = Math.min(...studiVals);
  const studiMax = Math.max(...studiVals);
  const radiusFor = (v: number) => {
    if (studiMax <= studiMin) return (R_MIN + R_MAX) / 2;
    const t = Math.sqrt((v - studiMin) / (studiMax - studiMin));
    return R_MIN + (R_MAX - R_MIN) * t;
  };

  // Colore del punto = quota alto rischio, normalizzata sul range osservato
  // per avere contrasto visivo anche quando i valori sono vicini tra loro.
  const rischioVals = plotted.map((r) => r.quotaAltoRischio);
  const rischioMin = Math.min(...rischioVals);
  const rischioMax = Math.max(...rischioVals);
  const colorFor = (v: number) =>
    riskGradientColor(rischioMax > rischioMin ? (v - rischioMin) / (rischioMax - rischioMin) : 0.5);

  const spazioBiancoCx = (xMedPix + MARGIN.left + plotW) / 2;
  const spazioBiancoCy = (yMedPix + MARGIN.top + plotH) / 2;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="quad-svg" role="img" aria-label="Domanda per densità di offerta, per regione">
      <rect x={MARGIN.left} y={MARGIN.top} width={xMedPix - MARGIN.left} height={yMedPix - MARGIN.top} fill={QUADRANTE_COLOR.nicchia} fillOpacity={0.07} />
      <rect x={xMedPix} y={MARGIN.top} width={MARGIN.left + plotW - xMedPix} height={yMedPix - MARGIN.top} fill={QUADRANTE_COLOR.presidiato} fillOpacity={0.07} />
      <rect x={MARGIN.left} y={yMedPix} width={xMedPix - MARGIN.left} height={MARGIN.top + plotH - yMedPix} fill={QUADRANTE_COLOR.contenuta} fillOpacity={0.06} />
      <rect x={xMedPix} y={yMedPix} width={MARGIN.left + plotW - xMedPix} height={MARGIN.top + plotH - yMedPix} fill={QUADRANTE_COLOR.spazioBianco} fillOpacity={0.09} />

      <text
        x={spazioBiancoCx}
        y={spazioBiancoCy}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        letterSpacing="0.04em"
        fill={QUADRANTE_COLOR.spazioBianco}
        opacity={0.4}
        pointerEvents="none"
      >
        SPAZIO BIANCO
      </text>

      <line x1={xMedPix} x2={xMedPix} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="#263341" strokeDasharray="4 3" />
      <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={yMedPix} y2={yMedPix} stroke="#263341" strokeDasharray="4 3" />

      <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH} stroke="#263341" />
      <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="#263341" />

      {xTicks.map((t) => (
        <g key={t}>
          <line x1={xPix(t)} x2={xPix(t)} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH + 4} stroke="#263341" />
          <text x={xPix(t)} y={MARGIN.top + plotH + 16} textAnchor="middle" fontSize={9.5} fill="#9fb3c4">
            {formatK(t)}
          </text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={MARGIN.left - 4} x2={MARGIN.left} y1={yPix(t)} y2={yPix(t)} stroke="#263341" />
          <text x={MARGIN.left - 8} y={yPix(t) + 3} textAnchor="end" fontSize={9.5} fill="#9fb3c4">
            {t.toFixed(1)}
          </text>
        </g>
      ))}

      <text x={MARGIN.left + plotW / 2} y={HEIGHT - 4} textAnchor="middle" fontSize={10.5} fill="#9fb3c4">
        Domanda — imprese obbligate (scala log)
      </text>
      <text
        x={13}
        y={MARGIN.top + plotH / 2}
        textAnchor="middle"
        fontSize={10.5}
        fill="#9fb3c4"
        transform={`rotate(-90 13 ${MARGIN.top + plotH / 2})`}
      >
        Offerta — densità primario /1.000 imprese
      </text>

      {plotted.map((r) => {
        const cx = xPix(r.impreseObbligate);
        const cy = yPix(r.densitaOfferta);
        const isSel = selected === r.nome;
        const radius = radiusFor(r.studiPrimario ?? 0);
        const color = colorFor(r.quotaAltoRischio);
        return (
          <g
            key={r.nome}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(isSel ? null : r.nome)}
            onMouseMove={(e) => onHover?.({ row: r, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => onHover?.(null)}
            aria-label={r.nome}
          >
            <circle
              cx={cx}
              cy={cy}
              r={isSel ? radius + 2 : radius}
              fill={color}
              stroke={isSel ? "#ffffff" : "rgba(0,0,0,.32)"}
              strokeWidth={isSel ? 2 : 1}
            />
            <text x={cx} y={cy - radius - (isSel ? 4 : 3)} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#e8eef4">
              {REGION_ABBR[r.nome] ?? r.nome.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
