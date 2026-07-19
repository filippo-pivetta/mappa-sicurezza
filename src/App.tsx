import { useEffect, useMemo, useState } from "react";
import { ItalyMap } from "./components/ItalyMap";
import { MetricToggles } from "./components/MetricToggles";
import { DetailPanel } from "./components/DetailPanel";
import { RankList } from "./components/RankList";
import { Tooltip } from "./components/Tooltip";
import { METRICS, metricValues, nationalAggregate } from "./lib/metrics";
import type { MetricKey, Regione, RegioniDataset } from "./lib/types";
import { sequentialColor } from "./lib/color";
import "./App.css";

type HoverInfo = { d: Regione; v: number | null; x: number; y: number } | null;
type ToggleTip = { x: number; y: number; title: string; desc: string } | null;

function App() {
  const [dataset, setDataset] = useState<RegioniDataset | null>(null);
  const [metric, setMetric] = useState<MetricKey>("densp");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverInfo>(null);
  const [toggleTip, setToggleTip] = useState<ToggleTip>(null);

  useEffect(() => {
    fetch("/data/regioni.json")
      .then((r) => r.json())
      .then(setDataset);
  }, []);

  const metricDef = useMemo(() => METRICS.find((m) => m.key === metric)!, [metric]);
  const regioni = dataset?.regioni ?? [];

  const { min, max } = useMemo(() => metricValues(metricDef, regioni), [metricDef, regioni]);

  const detailRegione = useMemo(() => {
    if (!dataset) return null;
    if (selected) {
      return regioni.find((r) => r.nome === selected) ?? null;
    }
    return nationalAggregate(regioni);
  }, [dataset, selected, regioni]);

  const totalCount = dataset?.regioni.length ?? 20;
  const filledCount = regioni.filter((r) => r.studi_primario != null).length;

  if (!dataset) {
    return (
      <div className="loading">
        <p>Caricamento dati...</p>
      </div>
    );
  }

  return (
    <>
      <header>
        <h1>Mappatura studi di consulenza sicurezza in Italia</h1>
        <div className="sub">
          Fonte studi: {dataset.fonte.studi}. Denominatore imprese: {dataset.fonte.imprese}. {filledCount} regioni
          rilevate su {totalCount}.
        </div>
      </header>

      <MetricToggles metric={metric} onChange={setMetric} onTip={setToggleTip} />

      <div className="wrap">
        <div className="card mapcard">
          <ItalyMap regioni={regioni} metric={metricDef} selected={selected} onSelect={setSelected} onHover={setHover} />
          <div className="legend">
            <span className="legswatch" style={{ background: sequentialColor(0) }} aria-hidden />
            <span>{isFinite(min) ? metricDef.fmt(min) : "n/d"}</span>
            <div className="legbar" />
            <span className="legswatch" style={{ background: sequentialColor(1) }} aria-hidden />
            <span>{isFinite(max) ? metricDef.fmt(max) : "+"}</span>
            <span className="legnd">
              <span className="ndswatch" aria-hidden /> da completare
            </span>
          </div>
        </div>

        {detailRegione && (
          <DetailPanel regione={detailRegione} isAggregate={!selected} fasce={dataset.fasce_fatturato} />
        )}

        <RankList metric={metricDef} regioni={regioni} selected={selected} onSelect={setSelected} />
      </div>

      <div className="foot">
        Clicca una regione sulla mappa o in classifica per il dettaglio. Passa il mouse sulle metriche in alto per la
        spiegazione.
      </div>

      {hover && (
        <Tooltip x={hover.x} y={hover.y} title={hover.d.nome}>
          {metricDef.label}: {hover.v == null ? "n/d" : metricDef.fmt(hover.v)}
          <br />
          Studi: {hover.d.studi_primario ?? "n/d"} &middot; Imprese: {hover.d.imprese_attive.toLocaleString("it")}
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

export default App;
