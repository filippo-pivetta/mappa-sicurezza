import type { Regione, RegioniDataset } from "../lib/types";

interface Props {
  regione: Regione;
  isAggregate: boolean;
  fasce: RegioniDataset["fasce_fatturato"];
}

export function DetailPanel({ regione: d, isAggregate, fasce }: Props) {
  if (d.studi_primario == null) {
    return (
      <div className="card detail">
        <h2>{d.nome}</h2>
        <div className="dsub">Regione non ancora rilevata su Telemaco.</div>
        <div className="kpi">
          <div className="n">{d.imprese_attive.toLocaleString("it")}</div>
          <div className="l">Imprese attive (denominatore pronto)</div>
        </div>
      </div>
    );
  }

  const sp = d.studi_primario;
  const sps = d.studi_prim_sec ?? 0;
  const cap = d.capitale ?? 0;
  const per = d.persona ?? 0;
  const som = d.sommerso ?? 0;
  const bands = d.bands ?? [];

  const densp = ((sp / d.imprese_attive) * 1000).toFixed(2);
  const densps = ((sps / d.imprese_attive) * 1000).toFixed(2);
  const pct = Math.round((cap / sp) * 100);
  const capw = Math.round((cap / sp) * 100);
  const perw = 100 - capw;
  const mx = Math.max(...bands, 1);

  return (
    <div className="card detail">
      <h2>{d.nome}</h2>
      <div className="dsub">{isAggregate ? "Aggregato delle regioni rilevate" : "Dettaglio regione"}</div>
      <div className="kpis">
        <div className="kpi">
          <div className="n">{sp.toLocaleString("it")}</div>
          <div className="l">Studi (primario)</div>
        </div>
        <div className="kpi">
          <div className="n">{sps.toLocaleString("it")}</div>
          <div className="l">Studi (prim+sec)</div>
        </div>
        <div className="kpi">
          <div className="n">{densp}</div>
          <div className="l">Densità prim /1.000</div>
        </div>
        <div className="kpi">
          <div className="n">{densps}</div>
          <div className="l">Densità prim+sec /1.000</div>
        </div>
        <div className="kpi">
          <div className="n">{pct}%</div>
          <div className="l">Quota società di capitale</div>
        </div>
        <div className="kpi">
          <div className="n">{som.toLocaleString("it")}</div>
          <div className="l">Sommerso (secondari)</div>
        </div>
      </div>
      <div className="blocktitle">Composizione (capitale vs persona/individuali)</div>
      <div className="split">
        <div className="cap" style={{ width: `${capw}%` }}>
          {cap} cap.
        </div>
        <div className="per" style={{ width: `${perw}%` }}>
          {per} pers.
        </div>
      </div>
      <div className="blocktitle">Distribuzione per fascia di fatturato (solo società di capitale)</div>
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
