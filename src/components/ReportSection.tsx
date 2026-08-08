import { useEffect, useMemo, useState } from "react";
import { routeHref } from "../lib/router";
import { nationalAggregate } from "../lib/metrics";
import { nationalAggregateDomanda } from "../lib/domandaMetrics";
import { RISK_TABLE } from "../lib/riskTable";
import type { RegioniDataset } from "../lib/types";
import type { DomandaDataset } from "../lib/domandaTypes";

export function ReportSection() {
  const [offerta, setOfferta] = useState<RegioniDataset | null>(null);
  const [domanda, setDomanda] = useState<DomandaDataset | null>(null);

  useEffect(() => {
    fetch("/data/regioni.json")
      .then((r) => r.json())
      .then(setOfferta);
    fetch("/data/domanda.json")
      .then((r) => r.json())
      .then(setDomanda);
  }, []);

  const offertaRegioni = useMemo(() => offerta?.regioni ?? [], [offerta]);
  const domandaRegioni = useMemo(() => domanda?.regioni ?? [], [domanda]);

  const offertaTot = useMemo(
    () => (offertaRegioni.length ? nationalAggregate(offertaRegioni) : null),
    [offertaRegioni],
  );
  const domandaTot = useMemo(
    () => (domandaRegioni.length ? nationalAggregateDomanda(domandaRegioni) : null),
    [domandaRegioni],
  );

  const offertaRows = useMemo(
    () =>
      [...offertaRegioni]
        .filter((r) => r.studi_primario != null)
        .sort((a, b) => (b.studi_primario ?? 0) - (a.studi_primario ?? 0)),
    [offertaRegioni],
  );

  const domandaRows = useMemo(
    () => [...domandaRegioni].sort((a, b) => b.imprese_con_dipendenti - a.imprese_con_dipendenti),
    [domandaRegioni],
  );

  const settoriNazionali = useMemo(() => {
    if (!domanda || !domandaTot) return [];
    return domanda.sezioni
      .map((s, i) => {
        const risk = RISK_TABLE.find((r) => r.sezione === s.sezione);
        const imprese = domandaTot.settori_imprese[i] ?? 0;
        return {
          sezione: s.sezione,
          nome: s.nome,
          imprese,
          addetti: domandaTot.settori_addetti[i] ?? 0,
          pct: domandaTot.imprese_con_dipendenti > 0 ? (imprese / domandaTot.imprese_con_dipendenti) * 100 : 0,
          rischio: risk?.rischio ?? null,
          peso: risk?.peso ?? null,
        };
      })
      .sort((a, b) => b.imprese - a.imprese);
  }, [domanda, domandaTot]);

  if (!offerta || !domanda || !offertaTot || !domandaTot) {
    return (
      <section className="report">
        <div className="reportinner">
          <h2 className="reporttitle">Report dati</h2>
          <p className="reportintro">Caricamento dati...</p>
        </div>
      </section>
    );
  }

  const denspTot = ((offertaTot.studi_primario ?? 0) / offertaTot.imprese_con_dipendenti) * 1000;
  const pctCapTot = offertaTot.studi_primario ? ((offertaTot.capitale ?? 0) / offertaTot.studi_primario) * 100 : 0;

  return (
    <section className="report">
      <div className="reportinner">
        <h2 className="reporttitle">Report dati</h2>
        <p className="reportintro">
          Riepilogo dei dati raccolti nelle due mappe: fonti, dato per regione e percentuali calcolate a partire da
          essi. Per l'analisi interattiva (filtri, confronto tra regioni) si può usare la mappa tramite i link qui
          sotto.
        </p>

        <div className="blocktitle">Fonti dei dati</div>
        <ul className="reportsources">
          <li>
            <strong>Offerta</strong> — studi di consulenza sicurezza: {offerta.fonte.studi}. Imprese con dipendenti:{" "}
            {offerta.fonte.imprese}. Addetti: {offerta.fonte.addetti}.
          </li>
          <li>
            <strong>Domanda</strong> — {domanda.fonte.dati}. {domanda.fonte.rischio}.
          </li>
        </ul>

        <h3 className="reportsectiontitle">Offerta — studi di consulenza sicurezza</h3>
        <div className="card">
          <div className="blocktitle">
            Totale Italia ({offertaRows.length} regioni rilevate su {offertaRegioni.length})
          </div>
          <div className="kpis">
            <div className="kpi">
              <div className="n">{(offertaTot.studi_primario ?? 0).toLocaleString("it")}</div>
              <div className="l">Studi (primario)</div>
            </div>
            <div className="kpi">
              <div className="n">{(offertaTot.studi_prim_sec ?? 0).toLocaleString("it")}</div>
              <div className="l">Studi (prim+sec)</div>
            </div>
            <div className="kpi">
              <div className="n">{denspTot.toFixed(2)}</div>
              <div className="l">Densità /1.000 imprese</div>
            </div>
            <div className="kpi">
              <div className="n">{pctCapTot.toFixed(0)}%</div>
              <div className="l">Quota società di capitale</div>
            </div>
            <div className="kpi">
              <div className="n">{offertaTot.imprese_con_dipendenti.toLocaleString("it")}</div>
              <div className="l">Imprese con dipendenti</div>
            </div>
            <div className="kpi">
              <div className="n">{offertaTot.numero_addetti.toLocaleString("it")}</div>
              <div className="l">Addetti</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="blocktitle">Per regione</div>
          <div className="qlinks">
            <span className="qlabel">Apri su mappa</span>
            <a className="qlink" href={routeHref("offerta", { metric: "dens", scope: "primario" })}>
              Densità
            </a>
            <a className="qlink" href={routeHref("offerta", { metric: "abs", scope: "primario" })}>
              Numero studi
            </a>
            <a className="qlink" href={routeHref("offerta", { metric: "pct", scope: "primario" })}>
              % società di capitale
            </a>
            <a className="qlink" href={routeHref("offerta", { metric: "densAdd", scope: "primario" })}>
              Densità per addetti
            </a>
          </div>
          <div className="datatablewrap">
            <table className="datatable">
              <thead>
                <tr>
                  <th>Regione</th>
                  <th>Imprese con dip.</th>
                  <th>Addetti</th>
                  <th>Studi primario</th>
                  <th>Studi prim+sec</th>
                  <th>Densità /1.000 imprese</th>
                  <th>% società capitale</th>
                  <th>Sommerso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {offertaRows.map((r) => {
                  const dens = ((r.studi_primario ?? 0) / r.imprese_con_dipendenti) * 1000;
                  const pctCap = r.capitale != null && r.studi_primario ? (r.capitale / r.studi_primario) * 100 : null;
                  return (
                    <tr key={r.nome}>
                      <td className="datastrong">{r.nome}</td>
                      <td className="datanum">{r.imprese_con_dipendenti.toLocaleString("it")}</td>
                      <td className="datanum">{r.numero_addetti.toLocaleString("it")}</td>
                      <td className="datanum">{(r.studi_primario ?? 0).toLocaleString("it")}</td>
                      <td className="datanum">{(r.studi_prim_sec ?? 0).toLocaleString("it")}</td>
                      <td className="datanum">{dens.toFixed(2)}</td>
                      <td className="datanum">{pctCap != null ? pctCap.toFixed(0) + "%" : "n/d"}</td>
                      <td className="datanum">{(r.sommerso ?? 0).toLocaleString("it")}</td>
                      <td>
                        <a
                          className="rowlink"
                          href={routeHref("offerta", { metric: "dens", scope: "primario", regione: r.nome })}
                          aria-label={`Apri ${r.nome} sulla mappa Offerta`}
                          title={`Apri ${r.nome} sulla mappa Offerta`}
                        >
                          ↗
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="reportsectiontitle">Domanda — imprese obbligate e rischio settoriale</h3>
        <div className="card">
          <div className="blocktitle">Totale Italia ({domandaRegioni.length} regioni)</div>
          <div className="kpis">
            <div className="kpi">
              <div className="n">{domandaTot.imprese_con_dipendenti.toLocaleString("it")}</div>
              <div className="l">Imprese obbligate</div>
            </div>
            <div className="kpi">
              <div className="n">{domandaTot.addetti.toLocaleString("it")}</div>
              <div className="l">Addetti</div>
            </div>
            <div className="kpi">
              <div className="n">{domandaTot.indice_rischio.toFixed(2)}</div>
              <div className="l">Indice di rischio</div>
            </div>
            <div className="kpi">
              <div className="n">{domandaTot.quota_alto_rischio.toFixed(0)}%</div>
              <div className="l">Quota alto rischio</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="blocktitle">Per regione</div>
          <div className="qlinks">
            <span className="qlabel">Apri su mappa</span>
            <a className="qlink" href={routeHref("domanda", { metric: "imprese" })}>
              Imprese obbligate
            </a>
            <a className="qlink" href={routeHref("domanda", { metric: "addetti" })}>
              Addetti
            </a>
            <a className="qlink" href={routeHref("domanda", { metric: "rischio" })}>
              Indice di rischio
            </a>
            <a className="qlink" href={routeHref("domanda", { metric: "alto" })}>
              Quota alto rischio
            </a>
          </div>
          <div className="datatablewrap">
            <table className="datatable">
              <thead>
                <tr>
                  <th>Regione</th>
                  <th>Imprese obbligate</th>
                  <th>Addetti</th>
                  <th>Indice di rischio</th>
                  <th>Quota alto rischio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {domandaRows.map((r) => (
                  <tr key={r.nome}>
                    <td className="datastrong">{r.nome}</td>
                    <td className="datanum">{r.imprese_con_dipendenti.toLocaleString("it")}</td>
                    <td className="datanum">{r.addetti.toLocaleString("it")}</td>
                    <td className="datanum">{r.indice_rischio.toFixed(2)}</td>
                    <td className="datanum">{r.quota_alto_rischio.toFixed(0)}%</td>
                    <td>
                      <a
                        className="rowlink"
                        href={routeHref("domanda", { metric: "imprese", regione: r.nome })}
                        aria-label={`Apri ${r.nome} sulla mappa Domanda`}
                        title={`Apri ${r.nome} sulla mappa Domanda`}
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="reportsectiontitle">Domanda — imprese per macro-settore (Italia)</h3>
        <div className="card">
          <div className="blocktitle">Aggregato nazionale, {settoriNazionali.length} sezioni ATECO rilevate</div>
          <div className="datatablewrap">
            <table className="datatable">
              <thead>
                <tr>
                  <th>Sezione</th>
                  <th>Descrizione</th>
                  <th>Imprese</th>
                  <th>Addetti</th>
                  <th>% su tot. imprese</th>
                  <th>Rischio</th>
                </tr>
              </thead>
              <tbody>
                {settoriNazionali.map((s) => (
                  <tr key={s.sezione}>
                    <td className="datastrong">{s.sezione}</td>
                    <td>{s.nome}</td>
                    <td className="datanum">{s.imprese.toLocaleString("it")}</td>
                    <td className="datanum">{s.addetti.toLocaleString("it")}</td>
                    <td className="datanum">{s.pct.toFixed(1)}%</td>
                    <td>
                      {s.rischio ? (
                        <span className={"riskbadge risk-" + s.rischio}>
                          {s.rischio} ({s.peso})
                        </span>
                      ) : (
                        "n/d"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="reportnote">
            Le sezioni ATECO A (Agricoltura), O (Pubblica amministrazione), T (Famiglie come datori di lavoro) e U
            (Organismi extraterritoriali) non compaiono: non sono censite come imprese con dipendenti in ISTAT ASIA.
          </p>
        </div>
      </div>
    </section>
  );
}
