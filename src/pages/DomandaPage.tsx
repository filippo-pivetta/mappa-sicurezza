import { useEffect, useMemo, useState } from "react";
import { ItalyMap } from "../components/ItalyMap";
import { MetricToggles } from "../components/MetricToggles";
import { DomandaDetailPanel } from "../components/DomandaDetailPanel";
import { RankList } from "../components/RankList";
import { Tooltip } from "../components/Tooltip";
import { NavHeader } from "../components/NavHeader";
import { DOMANDA_METRICS, nationalAggregateDomanda } from "../lib/domandaMetrics";
import { metricValues } from "../lib/metric";
import type { DomandaDataset, DomandaMetricKey, RegioneDomanda } from "../lib/domandaTypes";
import { sequentialColor } from "../lib/color";
import { useRouteParams } from "../lib/router";
import "../App.css";

type HoverInfo = { d: RegioneDomanda; v: number | null; x: number; y: number } | null;
type ToggleTip = { x: number; y: number; title: string; desc: string } | null;

export function DomandaPage() {
  const params = useRouteParams();
  const [dataset, setDataset] = useState<DomandaDataset | null>(null);
  const [metric, setMetric] = useState<DomandaMetricKey>(() => {
    const m = params.get("metric");
    return DOMANDA_METRICS.some((x) => x.key === m) ? (m as DomandaMetricKey) : "imprese";
  });
  const [selected, setSelected] = useState<string | null>(() => params.get("regione"));
  const [hover, setHover] = useState<HoverInfo>(null);
  const [toggleTip, setToggleTip] = useState<ToggleTip>(null);

  useEffect(() => {
    fetch("/data/domanda.json")
      .then((r) => r.json())
      .then(setDataset);
  }, []);

  useEffect(() => {
    const dismiss = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".tg") && !target.closest(".map-svg")) {
        setHover(null);
        setToggleTip(null);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  const metricDef = useMemo(() => DOMANDA_METRICS.find((m) => m.key === metric)!, [metric]);
  const regioni = dataset?.regioni ?? [];

  const { min, max } = useMemo(() => metricValues(metricDef, regioni, undefined), [metricDef, regioni]);

  const detailRegione = useMemo(() => {
    if (!dataset) return null;
    const match = selected ? regioni.find((r) => r.nome === selected) : null;
    return match ?? nationalAggregateDomanda(regioni);
  }, [dataset, selected, regioni]);

  const totalCount = dataset?.regioni.length ?? 20;

  if (!dataset) {
    return (
      <>
        <NavHeader active="domanda" />
        <div className="loading">
          <p>Caricamento dati...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavHeader active="domanda" />

      <header>
        <h1>Mappatura della domanda di sicurezza sul lavoro in Italia</h1>
        <div className="sub">
          Fonte: {dataset.fonte.dati}. {dataset.fonte.rischio}. {totalCount} regioni rilevate su {totalCount}.
        </div>
      </header>

      <MetricToggles
        metrics={DOMANDA_METRICS}
        metricKey={metric}
        onChange={(k) => setMetric(k as DomandaMetricKey)}
        onTip={setToggleTip}
      />

      <div className="wrap">
        <div className="card mapcard">
          <ItalyMap
            regioni={regioni}
            metric={metricDef}
            extra={undefined}
            selected={selected}
            onSelect={setSelected}
            onHover={setHover}
          />
          <div className="legend">
            <span className="legswatch" style={{ background: sequentialColor(0) }} aria-hidden />
            <span>{isFinite(min) ? metricDef.fmt(min) : "n/d"}</span>
            <div className="legbar" />
            <span className="legswatch" style={{ background: sequentialColor(1) }} aria-hidden />
            <span>{isFinite(max) ? metricDef.fmt(max) : "+"}</span>
          </div>
        </div>

        {detailRegione && (
          <DomandaDetailPanel regione={detailRegione} isAggregate={!selected} sezioni={dataset.sezioni} />
        )}

        <RankList metric={metricDef} regioni={regioni} extra={undefined} selected={selected} onSelect={setSelected} />
      </div>

      <div className="foot">
        Clicca una regione sulla mappa o in classifica per il dettaglio. Passa il mouse sulle metriche in alto per la
        spiegazione.
      </div>

      {hover && (
        <Tooltip x={hover.x} y={hover.y} title={hover.d.nome}>
          {metricDef.label}: {hover.v == null ? "n/d" : metricDef.fmt(hover.v)}
          <br />
          Imprese con dipendenti: {hover.d.imprese_con_dipendenti.toLocaleString("it")} &middot; Addetti:{" "}
          {hover.d.addetti.toLocaleString("it")}
        </Tooltip>
      )}
      {toggleTip && (
        <Tooltip x={toggleTip.x} y={toggleTip.y} title={toggleTip.title}>
          {toggleTip.desc}
        </Tooltip>
      )}
    </>
  );
}
