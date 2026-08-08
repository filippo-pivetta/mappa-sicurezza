import { useEffect, useMemo, useState } from "react";
import { ItalyMap } from "../components/ItalyMap";
import { MetricToggles } from "../components/MetricToggles";
import { ScopeToggle } from "../components/ScopeToggle";
import { DetailPanel } from "../components/DetailPanel";
import { RankList } from "../components/RankList";
import { Tooltip } from "../components/Tooltip";
import { NavHeader } from "../components/NavHeader";
import { METRICS, SCOPES, metricValues, nationalAggregate, studiCount } from "../lib/metrics";
import type { MetricKey, Regione, RegioniDataset, Scope } from "../lib/types";
import { sequentialColor } from "../lib/color";
import { useRouteParams } from "../lib/router";
import "../App.css";

type HoverInfo = { d: Regione; v: number | null; x: number; y: number } | null;
type ToggleTip = { x: number; y: number; title: string; desc: string } | null;

export function OffertaPage() {
  const params = useRouteParams();
  const [dataset, setDataset] = useState<RegioniDataset | null>(null);
  const [metric, setMetric] = useState<MetricKey>(() => {
    const m = params.get("metric");
    return METRICS.some((x) => x.key === m) ? (m as MetricKey) : "dens";
  });
  const [scope, setScope] = useState<Scope>(() => {
    const s = params.get("scope");
    return SCOPES.some((x) => x.key === s) ? (s as Scope) : "primario";
  });
  const [selected, setSelected] = useState<string | null>(() => params.get("regione"));
  const [hover, setHover] = useState<HoverInfo>(null);
  const [toggleTip, setToggleTip] = useState<ToggleTip>(null);

  useEffect(() => {
    fetch("/data/regioni.json")
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

  const metricDef = useMemo(() => METRICS.find((m) => m.key === metric)!, [metric]);
  const regioni = dataset?.regioni ?? [];

  const { min, max } = useMemo(() => metricValues(metricDef, regioni, scope), [metricDef, regioni, scope]);

  const detailRegione = useMemo(() => {
    if (!dataset) return null;
    const match = selected ? regioni.find((r) => r.nome === selected) : null;
    return match ?? nationalAggregate(regioni);
  }, [dataset, selected, regioni]);

  const totalCount = dataset?.regioni.length ?? 20;
  const filledCount = regioni.filter((r) => r.studi_primario != null).length;
  const scopeLabel = SCOPES.find((s) => s.key === scope)!.short;

  if (!dataset) {
    return (
      <>
        <NavHeader active="offerta" />
        <div className="loading">
          <p>Caricamento dati...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavHeader active="offerta" />

      <header>
        <h1>Mappatura studi di consulenza sicurezza in Italia</h1>
        <div className="sub">
          Fonte studi: {dataset.fonte.studi}. Denominatore imprese: {dataset.fonte.imprese}. {filledCount} regioni
          rilevate su {totalCount}.
        </div>
      </header>

      <ScopeToggle scope={scope} onChange={setScope} />

      <MetricToggles
        metrics={METRICS}
        metricKey={metric}
        onChange={(k) => setMetric(k as MetricKey)}
        onTip={setToggleTip}
      />

      <div className="wrap">
        <div className="card mapcard">
          <ItalyMap
            regioni={regioni}
            metric={metricDef}
            extra={scope}
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
            {filledCount < totalCount && (
              <span className="legnd">
                <span className="ndswatch" aria-hidden /> da completare
              </span>
            )}
          </div>
        </div>

        {detailRegione && (
          <DetailPanel
            regione={detailRegione}
            isAggregate={!selected}
            scope={scope}
            fasce={dataset.fasce_fatturato}
          />
        )}

        <RankList
          metric={metricDef}
          regioni={regioni}
          extra={scope}
          extraLabel={metricDef.key !== "pct" ? scopeLabel : undefined}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      <div className="foot">
        Clicca una regione sulla mappa o in classifica per il dettaglio. Passa il mouse sulle metriche in alto per la
        spiegazione.
      </div>

      {hover && (
        <Tooltip x={hover.x} y={hover.y} title={hover.d.nome}>
          {metricDef.label}: {hover.v == null ? "n/d" : metricDef.fmt(hover.v)}
          <br />
          Studi ({scopeLabel}): {studiCount(hover.d, scope) ?? "n/d"} &middot; Imprese con dipendenti:{" "}
          {hover.d.imprese_con_dipendenti.toLocaleString("it")}
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
