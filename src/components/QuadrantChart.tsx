import { REGION_ABBR } from "../lib/regionAbbr";
import type { CoperturaRow, Quadrante } from "../lib/copertura";

const WIDTH = 640;
const HEIGHT = 420;
const MARGIN = { top: 16, right: 20, bottom: 42, left: 54 };

export const QUADRANTE_COLOR: Record<Quadrante, string> = {
  presidiato: "#39c0c8",
  spazioBianco: "#e8a33d",
  nicchia: "#8a7fd9",
  contenuta: "#5c7186",
};

const X_CANDIDATES = [2000, 5000, 10000, 20000, 50000, 100000, 200000, 300000];
const Y_CANDIDATES = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];

function formatK(v: number): string {
  return v >= 1000 ? Math.round(v / 1000).toLocaleString("it") + "k" : Math.round(v).toString();
}

interface Props {
  rows: CoperturaRow[];
  medianDomanda: number;
  medianDensita: number;
  selected: string | null;
  onSelect: (nome: string | null) => void;
}

export function QuadrantChart({ rows, medianDomanda, medianDensita, selected, onSelect }: Props) {
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

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="quad-svg" role="img" aria-label="Domanda per densità di offerta, per regione">
      <rect x={MARGIN.left} y={MARGIN.top} width={xMedPix - MARGIN.left} height={yMedPix - MARGIN.top} fill={QUADRANTE_COLOR.nicchia} fillOpacity={0.07} />
      <rect x={xMedPix} y={MARGIN.top} width={MARGIN.left + plotW - xMedPix} height={yMedPix - MARGIN.top} fill={QUADRANTE_COLOR.presidiato} fillOpacity={0.07} />
      <rect x={MARGIN.left} y={yMedPix} width={xMedPix - MARGIN.left} height={MARGIN.top + plotH - yMedPix} fill={QUADRANTE_COLOR.contenuta} fillOpacity={0.06} />
      <rect x={xMedPix} y={yMedPix} width={MARGIN.left + plotW - xMedPix} height={MARGIN.top + plotH - yMedPix} fill={QUADRANTE_COLOR.spazioBianco} fillOpacity={0.09} />

      <line x1={xMedPix} x2={xMedPix} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="#3a4f63" strokeDasharray="4 3" />
      <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={yMedPix} y2={yMedPix} stroke="#3a4f63" strokeDasharray="4 3" />

      <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH} stroke="#3a4f63" />
      <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="#3a4f63" />

      {xTicks.map((t) => (
        <g key={t}>
          <line x1={xPix(t)} x2={xPix(t)} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH + 4} stroke="#3a4f63" />
          <text x={xPix(t)} y={MARGIN.top + plotH + 16} textAnchor="middle" fontSize={9.5} fill="#8ea3b5">
            {formatK(t)}
          </text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={MARGIN.left - 4} x2={MARGIN.left} y1={yPix(t)} y2={yPix(t)} stroke="#3a4f63" />
          <text x={MARGIN.left - 8} y={yPix(t) + 3} textAnchor="end" fontSize={9.5} fill="#8ea3b5">
            {t.toFixed(1)}
          </text>
        </g>
      ))}

      <text x={MARGIN.left + plotW / 2} y={HEIGHT - 4} textAnchor="middle" fontSize={10.5} fill="#c7d5e2">
        Domanda — imprese obbligate (scala log)
      </text>
      <text
        x={13}
        y={MARGIN.top + plotH / 2}
        textAnchor="middle"
        fontSize={10.5}
        fill="#c7d5e2"
        transform={`rotate(-90 13 ${MARGIN.top + plotH / 2})`}
      >
        Offerta — densità primario /1.000 imprese
      </text>

      {plotted.map((r) => {
        const cx = xPix(r.impreseObbligate);
        const cy = yPix(r.densitaOfferta);
        const isSel = selected === r.nome;
        const color = r.quadrante ? QUADRANTE_COLOR[r.quadrante] : "#8ea3b5";
        return (
          <g
            key={r.nome}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(isSel ? null : r.nome)}
            aria-label={r.nome}
          >
            <circle
              cx={cx}
              cy={cy}
              r={isSel ? 7 : 5.5}
              fill={color}
              stroke={isSel ? "#ffffff" : "rgba(0,0,0,.32)"}
              strokeWidth={isSel ? 2 : 1}
            />
            <text x={cx} y={cy - (isSel ? 11 : 9)} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#e8eef4">
              {REGION_ABBR[r.nome] ?? r.nome.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
