import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { normalizeRegionName } from "../lib/nameMap";
import { sequentialColor, textColorFor } from "../lib/color";
import type { MetricDef } from "../lib/metric";
import { metricValues } from "../lib/metric";

const WIDTH = 460;
const HEIGHT = 620;

interface Props<T extends { nome: string }, E> {
  regioni: T[];
  metric: MetricDef<T, E>;
  extra: E;
  selected: string | null;
  onSelect: (nome: string | null) => void;
  onHover: (info: { d: T; v: number | null; x: number; y: number } | null) => void;
}

export function ItalyMap<T extends { nome: string }, E>({
  regioni,
  metric,
  extra,
  selected,
  onSelect,
  onHover,
}: Props<T, E>) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/limits_IT_regions.topo.json")
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const objKey = Object.keys(topo.objects)[0];
        const fc = topojson.feature(topo, topo.objects[objKey] as GeometryCollection) as unknown as FeatureCollection;
        setGeo(fc);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { arr, min, max } = useMemo(() => metricValues(metric, regioni, extra), [metric, regioni, extra]);
  const byName = useMemo(() => {
    const m = new Map<string, { d: T; v: number | null }>();
    arr.forEach((x) => m.set(x.d.nome, x));
    return m;
  }, [arr]);

  const path = useMemo(() => {
    if (!geo) return null;
    const projection = geoMercator().fitSize([WIDTH, HEIGHT], geo);
    return geoPath(projection);
  }, [geo]);

  if (!geo || !path) {
    return (
      <svg className="map-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Caricamento mappa dell'Italia">
        <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fill="#8ea3b5" fontSize={13}>
          Caricamento mappa...
        </text>
      </svg>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="map-svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Mappa dell'Italia per regione"
    >
      {(geo.features as Feature<Geometry>[]).map((f, i) => {
        const rawName = (f.properties as Record<string, unknown>)?.reg_name as string;
        const name = normalizeRegionName(rawName);
        const entry = byName.get(name);
        const v = entry?.v ?? null;
        const isSel = selected === name;
        const d = path(f) ?? "";
        let fill = "#243546";
        let stroke = "#3a4f63";
        let dash: string | undefined = "4 3";
        if (v != null) {
          const t = max > min ? (v - min) / (max - min) : 0.5;
          fill = sequentialColor(t);
          stroke = isSel ? "#ffffff" : "rgba(0,0,0,.28)";
          dash = undefined;
        } else if (isSel) {
          stroke = "#ffffff";
        }
        return (
          <path
            key={rawName ?? i}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSel ? 2.5 : 1}
            strokeDasharray={dash}
            style={{ cursor: "pointer", transition: "stroke .12s" }}
            onClick={(e) => {
              onSelect(selected === name ? null : name);
              if (entry) onHover({ d: entry.d, v: entry.v, x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => {
              if (entry) onHover({ d: entry.d, v: entry.v, x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
      {(geo.features as Feature<Geometry>[]).map((f, i) => {
        const rawName = (f.properties as Record<string, unknown>)?.reg_name as string;
        const name = normalizeRegionName(rawName);
        const entry = byName.get(name);
        const v = entry?.v ?? null;
        const centroid = path.centroid(f);
        if (!isFinite(centroid[0]) || !isFinite(centroid[1])) return null;
        let tc = "#aebfce";
        if (v != null) {
          const t = max > min ? (v - min) / (max - min) : 0.5;
          tc = textColorFor(t);
        }
        const abbr = ABBR[name] ?? name.slice(0, 3).toUpperCase();
        return (
          <text
            key={"lab" + (rawName ?? i)}
            x={centroid[0]}
            y={centroid[1]}
            textAnchor="middle"
            fontSize={10.5}
            fontWeight={800}
            fill={tc}
            pointerEvents="none"
          >
            {abbr}
          </text>
        );
      })}
    </svg>
  );
}

const ABBR: Record<string, string> = {
  "Piemonte": "PIE",
  "Valle d'Aosta": "VdA",
  "Lombardia": "LOM",
  "Trentino-Alto Adige": "TAA",
  "Veneto": "VEN",
  "Friuli-Venezia Giulia": "FVG",
  "Liguria": "LIG",
  "Emilia-Romagna": "EMR",
  "Toscana": "TOS",
  "Umbria": "UMB",
  "Marche": "MAR",
  "Lazio": "LAZ",
  "Abruzzo": "ABR",
  "Molise": "MOL",
  "Campania": "CAM",
  "Puglia": "PUG",
  "Basilicata": "BAS",
  "Calabria": "CAL",
  "Sicilia": "SIC",
  "Sardegna": "SAR",
};
