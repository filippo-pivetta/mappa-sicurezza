import { useState } from "react";
import type { RegioneDomanda, SezioneDef } from "../lib/domandaTypes";
import { RiskTableModal } from "./RiskTableModal";

interface Props {
  regione: RegioneDomanda;
  isAggregate: boolean;
  sezioni: SezioneDef[];
}

export function DomandaDetailPanel({ regione: d, isAggregate, sezioni }: Props) {
  const [showRiskTable, setShowRiskTable] = useState(false);

  const rm = d.risk_mix;
  const rmTot = rm.basso + rm.medio + rm.alto || 1;
  const bassoW = Math.round((rm.basso / rmTot) * 100);
  const medioW = Math.round((rm.medio / rmTot) * 100);
  const altoW = 100 - bassoW - medioW;

  const settoriOrdinati = sezioni
    .map((s, i) => ({ ...s, imprese: d.settori_imprese[i] ?? 0 }))
    .sort((a, b) => b.imprese - a.imprese);
  const mx = Math.max(...settoriOrdinati.map((s) => s.imprese), 1);

  return (
    <div className="card detail">
      <h2>{d.nome}</h2>
      <div className="dsub">{isAggregate ? "Aggregato nazionale" : "Dettaglio regione"}</div>
      <div className="kpis">
        <div className="kpi">
          <div className="n">{Math.round(d.imprese_con_dipendenti).toLocaleString("it")}</div>
          <div className="l">Imprese obbligate</div>
        </div>
        <div className="kpi">
          <div className="n">{Math.round(d.addetti).toLocaleString("it")}</div>
          <div className="l">Addetti</div>
        </div>
        <div className="kpi">
          <div className="n">{d.indice_rischio.toFixed(2)}</div>
          <div className="l">Indice di rischio</div>
        </div>
        <div className="kpi">
          <div className="n">{d.quota_alto_rischio.toFixed(0)}%</div>
          <div className="l">Quota alto rischio</div>
        </div>
      </div>
      <div className="blocktitle">
        Composizione per rischio (quota imprese)
        <button
          type="button"
          className="infobtn"
          onClick={() => setShowRiskTable(true)}
          aria-label="Mostra la tabella di rischio per settore"
          title="Tabella di rischio per settore"
        >
          i
        </button>
      </div>
      <div className="split">
        <div className="risklow" style={{ width: `${bassoW}%` }}>
          {bassoW > 8 ? `${bassoW}% basso` : ""}
        </div>
        <div className="riskmed" style={{ width: `${medioW}%` }}>
          {medioW > 8 ? `${medioW}% medio` : ""}
        </div>
        <div className="riskhigh" style={{ width: `${altoW}%` }}>
          {altoW > 8 ? `${altoW}% alto` : ""}
        </div>
      </div>
      <div className="blocktitle">Imprese per macro-settore (divisione ATECO aggregata)</div>
      {settoriOrdinati.map((s) => (
        <div className="frow" key={s.sezione}>
          <div className="flab wide">{s.nome}</div>
          <div className="ftrack">
            <div className="ffill" style={{ width: `${mx ? (s.imprese / mx) * 100 : 0}%` }} />
          </div>
          <div className="fval">{s.imprese.toLocaleString("it")}</div>
        </div>
      ))}
      {showRiskTable && <RiskTableModal onClose={() => setShowRiskTable(false)} />}
    </div>
  );
}
