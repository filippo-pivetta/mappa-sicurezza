import type { Regione, RegioniDataset, Scope } from "../lib/types";
import { SCOPES, studiCount } from "../lib/metrics";

interface Props {
  regione: Regione;
  isAggregate: boolean;
  scope: Scope;
  fasce: RegioniDataset["fasce_fatturato"];
}

export function DetailPanel({ regione: d, isAggregate, scope, fasce }: Props) {
  const scopeLabel = SCOPES.find((s) => s.key === scope)!.short;

  if (d.studi_primario == null) {
    return (
      <div className="card detail">
        <h2>{d.nome}</h2>
        <div className="dsub">Regione non ancora rilevata su Telemaco. Stima di opportunità già disponibile.</div>
        <div className="kpis">
          <div className="kpi">
            <div className="n">{d.imprese_con_dipendenti.toLocaleString("it")}</div>
            <div className="l">Imprese con dipendenti (denominatore pronto)</div>
          </div>
          <div className="kpi">
            <div className="n">{d.numero_addetti.toLocaleString("it")}</div>
            <div className="l">Addetti</div>
          </div>
        </div>
      </div>
    );
  }

  const count = studiCount(d, scope) ?? 0;
  const cap = d.capitale ?? 0;
  const per = d.persona ?? 0;
  const bands = d.bands ?? [];

  const dens = ((count / d.imprese_con_dipendenti) * 1000).toFixed(2);
  const densAdd = ((count / d.numero_addetti) * 1000).toFixed(2);
  const pct = Math.round((cap / d.studi_primario) * 100);
  const capw = Math.round((cap / d.studi_primario) * 100);
  const perw = 100 - capw;
  const mx = Math.max(...bands, 1);

  return (
    <div className="card detail">
      <h2>{d.nome}</h2>
      <div className="dsub">
        {isAggregate ? "Aggregato delle regioni rilevate" : "Dettaglio regione"} &middot; attività: {scopeLabel}
      </div>
      <div className="kpis">
        <div className="kpi">
          <div className="n">{count.toLocaleString("it")}</div>
          <div className="l">Studi ({scopeLabel})</div>
        </div>
        <div className="kpi">
          <div className="n">{dens}</div>
          <div className="l">Densità /1.000 imprese</div>
        </div>
        <div className="kpi">
          <div className="n">{densAdd}</div>
          <div className="l">Densità /1.000 addetti</div>
        </div>
        <div className="kpi">
          <div className="n">{pct}%</div>
          <div className="l">Quota società di capitale (primario)</div>
        </div>
      </div>
      <div className="blocktitle">Composizione attività primaria (capitale vs persona/individuali)</div>
      <div className="split">
        <div className="cap" style={{ width: `${capw}%` }}>
          {cap} cap.
        </div>
        <div className="per" style={{ width: `${perw}%` }}>
          {per} pers.
        </div>
      </div>
      <div className="blocktitle">
        Distribuzione per fascia di fatturato (attività primaria, solo società di capitale)
      </div>
      {bands.map((v, i) => (
        <div className="frow" key={i}>
          <div className="flab">{fasce[i]}</div>
          <div className="ftrack">
            <div className="ffill" style={{ width: `${mx ? (v / mx) * 100 : 0}%` }} />
          </div>
          <div className="fval">{v}</div>
        </div>
      ))}
    </div>
  );
}
