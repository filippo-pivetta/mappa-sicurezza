import { useEffect, useMemo, useState } from "react";
import { routeHref } from "../lib/router";
import { nationalAggregate } from "../lib/metrics";
import { nationalAggregateDomanda } from "../lib/domandaMetrics";
import { RISK_TABLE } from "../lib/riskTable";
import { buildCopertura, QUADRANTE_LABEL } from "../lib/copertura";
import { QuadrantChart, QUADRANTE_COLOR } from "./QuadrantChart";
import type { RegioniDataset } from "../lib/types";
import type { DomandaDataset } from "../lib/domandaTypes";

export function ReportSection() {
  const [offerta, setOfferta] = useState<RegioniDataset | null>(null);
  const [domanda, setDomanda] = useState<DomandaDataset | null>(null);
  const [quadSel, setQuadSel] = useState<string | null>(null);

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

  const copertura = useMemo(() => {
    if (!offerta || !domanda) return null;
    return buildCopertura(offerta.regioni, domanda.regioni);
  }, [offerta, domanda]);

  if (!offerta || !domanda || !offertaTot || !domandaTot || !copertura) {
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
  const sommersoMult = offertaTot.studi_primario ? (offertaTot.studi_prim_sec ?? 0) / offertaTot.studi_primario : 0;
  const impreseServiteStudio = offertaTot.studi_primario ? domandaTot.imprese_con_dipendenti / offertaTot.studi_primario : 0;

  const top3ShareOfferta = computeTop3Share(offertaRows);

  const rischioMin = Math.min(...domandaRows.map((r) => r.indice_rischio));
  const rischioMax = Math.max(...domandaRows.map((r) => r.indice_rischio));

  const topDensita = [...copertura.rows]
    .filter((r) => r.densitaOfferta != null)
    .sort((a, b) => (b.densitaOfferta as number) - (a.densitaOfferta as number))
    .slice(0, 5);

  const spazioBiancoTop = copertura.rows
    .filter((r) => r.quadrante === "spazioBianco")
    .sort((a, b) => b.impreseObbligate - a.impreseObbligate);

  const top4Settori = settoriNazionali.slice(0, 4);

  return (
    <section className="report">
      <div className="reportinner">
        <h2 className="reporttitle">Report dati</h2>
        <p className="reportintro">
          Analisi di mercato degli studi di consulenza sicurezza in Italia: dimensione e struttura dell'offerta e
          della domanda, e il loro incrocio per regione. Tabelle complete e link alle viste filtrate delle mappe più
          sotto.
        </p>

        <h3 className="reportsectiontitle">Sintesi esecutiva</h3>
        <div className="card">
          <p className="reportpara">
            L'offerta conta <strong>{(offertaTot.studi_primario ?? 0).toLocaleString("it")}</strong> studi a codice
            ATECO primario ({(offertaTot.studi_prim_sec ?? 0).toLocaleString("it")} includendo il secondario, ×
            {sommersoMult.toFixed(1)}) a fronte di <strong>{domandaTot.imprese_con_dipendenti.toLocaleString("it")}</strong>{" "}
            imprese con dipendenti obbligate D.Lgs 81/08 e {domandaTot.addetti.toLocaleString("it")} addetti: in
            media {Math.round(impreseServiteStudio).toLocaleString("it")} imprese obbligate per ogni studio a codice
            primario attivo. Il {pctCapTot.toFixed(0)}% degli studi è società di capitale.
          </p>
          <p className="reportpara">
            La densità di offerta (studi primari ogni 1.000 imprese obbligate) è più alta in{" "}
            {topDensita
              .map((r) => `${r.nome} (${(r.densitaOfferta as number).toFixed(2)})`)
              .join(", ")}
            . A parità di domanda sopra la mediana nazionale, la densità è invece sotto la mediana in{" "}
            {spazioBiancoTop.map((r) => `${r.nome} (${(r.densitaOfferta as number).toFixed(2)})`).join(", ")}: qui il
            rapporto imprese obbligate/studio è più alto della media nazionale. Dettaglio nella sezione "Copertura e
            spazio bianco".
          </p>
          <p className="reportpara">
            Il rischio settoriale (Accordo Stato-Regioni) è classificato alto per il{" "}
            {domandaTot.quota_alto_rischio.toFixed(0)}% delle imprese obbligate a livello nazionale; l'indice di
            rischio medio per regione varia in un intervallo ristretto ({rischioMin.toFixed(2)}–
            {rischioMax.toFixed(2)}).
          </p>
        </div>

        <h3 className="reportsectiontitle">Perimetro e metodo</h3>
        <ul className="reportsources">
          <li>
            <strong>Offerta</strong>: studi con codice ATECO 74.99.21 (sicurezza come attività primaria) e 74.99.29
            (attività secondaria), sedi attive, fonte Telemaco.
          </li>
          <li>
            <strong>Domanda</strong>: imprese con dipendenti — gli obbligati D.Lgs 81/08 — e relativi addetti, per
            regione e divisione ATECO, fonte ISTAT ASIA 2024.
          </li>
          <li>
            <strong>Rischio</strong>: classificazione basso/medio/alto per divisione ATECO secondo l'Accordo
            Stato-Regioni, pesi numerici 1/2/3 usati per l'indice di rischio pesato sul mix settoriale reale di ogni
            regione.
          </li>
        </ul>

        <h3 className="reportsectiontitle">Dimensione del mercato</h3>
        <div className="card">
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
              <div className="n">{domandaTot.imprese_con_dipendenti.toLocaleString("it")}</div>
              <div className="l">Imprese obbligate</div>
            </div>
            <div className="kpi">
              <div className="n">{domandaTot.addetti.toLocaleString("it")}</div>
              <div className="l">Addetti</div>
            </div>
            <div className="kpi">
              <div className="n">{Math.round(impreseServiteStudio).toLocaleString("it")}</div>
              <div className="l">Imprese obbligate per studio (primario)</div>
            </div>
            <div className="kpi">
              <div className="n">{denspTot.toFixed(2)}</div>
              <div className="l">Densità nazionale /1.000 imprese</div>
            </div>
          </div>
        </div>

        <h3 className="reportsectiontitle">Struttura dell'offerta</h3>
        <div className="card">
          <p className="reportpara">
            Il {pctCapTot.toFixed(0)}% degli studi a codice primario è una società di capitale (SRL, SpA), con
            bilancio pubblico; il resto è ditta individuale o società di persone. Includendo l'attività secondaria il
            numero di studi sale di {sommersoMult.toFixed(2)}× ({(offertaTot.sommerso ?? 0).toLocaleString("it")} in
            più). Le prime 3 regioni per numero di studi ({top3ShareOfferta.nomi.join(", ")}) coprono il{" "}
            {top3ShareOfferta.pct.toFixed(0)}% degli studi primari nazionali.
          </p>
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

        <h3 className="reportsectiontitle">Struttura della domanda</h3>
        <div className="card">
          <p className="reportpara">
            I quattro macro-settori con più imprese obbligate sono{" "}
            {top4Settori.map((s) => `${s.nome} (${s.pct.toFixed(1)}%)`).join(", ")}. Il{" "}
            {domandaTot.quota_alto_rischio.toFixed(0)}% delle imprese obbligate opera in settori a rischio ALTO.
            L'indice di rischio medio per regione varia poco ({rischioMin.toFixed(2)}–{rischioMax.toFixed(2)}): la
            rischiosità del tessuto produttivo, letta a questo livello di aggregazione, è simile su tutto il
            territorio — a variare da regione a regione è soprattutto il volume di imprese, non il mix di rischio.
          </p>
          <div className="kpis">
            <div className="kpi">
              <div className="n">{domandaTot.indice_rischio.toFixed(2)}</div>
              <div className="l">Indice di rischio nazionale</div>
            </div>
            <div className="kpi">
              <div className="n">{domandaTot.quota_alto_rischio.toFixed(0)}%</div>
              <div className="l">Quota alto rischio</div>
            </div>
          </div>
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
            <a className="qlink" href={routeHref("domanda", { metric: "domandaPesata" })}>
              Domanda pesata
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

          <div className="blocktitle" style={{ marginTop: 18 }}>
            Imprese per macro-settore (aggregato nazionale, {settoriNazionali.length} sezioni ATECO rilevate)
          </div>
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

        <h3 className="reportsectiontitle">Copertura e spazio bianco</h3>
        <div className="card">
          <p className="reportpara">
            Incrocio tra densità di offerta e dimensione della domanda per regione, rispetto alle mediane nazionali (
            {Math.round(copertura.medianDomanda).toLocaleString("it")} imprese obbligate,{" "}
            {copertura.medianDensita.toFixed(2)} studi/1.000 imprese di densità). Le regioni con domanda sopra la
            mediana e densità sotto la mediana — {spazioBiancoTop.map((r) => r.nome).join(", ")} — hanno il maggior
            numero di imprese obbligate per studio attivo tra le regioni ad alta domanda.
          </p>
          <QuadrantChart
            rows={copertura.rows}
            medianDomanda={copertura.medianDomanda}
            medianDensita={copertura.medianDensita}
            selected={quadSel}
            onSelect={setQuadSel}
          />
          <div className="quadlegend">
            {(Object.keys(QUADRANTE_LABEL) as (keyof typeof QUADRANTE_LABEL)[]).map((q) => (
              <div className="quaditem" key={q}>
                <span className="quaddot" style={{ background: QUADRANTE_COLOR[q] }} aria-hidden />
                {QUADRANTE_LABEL[q]}
              </div>
            ))}
          </div>
          <p className="reportnote">
            Vedi la classifica completa e il grafico interattivo nella scheda{" "}
            <a className="qlink" href={routeHref("copertura")}>
              Copertura · Opportunità
            </a>
            .
          </p>
        </div>

        <h3 className="reportsectiontitle">Limiti</h3>
        <ul className="reportsources">
          <li>Il codice ATECO è autodichiarato dall'impresa, non verificato in modo indipendente.</li>
          <li>
            Il rischio è assegnato per divisione ATECO (settore), non per singola impresa: è una stima di mix
            settoriale, non una misura diretta del rischio reale di ciascuna azienda.
          </li>
          <li>La propensione delle imprese a esternalizzare la consulenza sicurezza non è misurabile dai dati disponibili.</li>
          <li>
            La sede legale rilevata su Telemaco non coincide necessariamente con l'area di mercato effettivamente
            servita dallo studio.
          </li>
          <li>
            L'offerta a solo codice ATECO primario sottostima il numero di operatori attivi nel settore: da qui il
            dato "prim+sec" e il "sommerso" a integrazione.
          </li>
        </ul>

        <h3 className="reportsectiontitle">Fonti e metodologia</h3>
        <ul className="reportsources">
          <li>
            <strong>Offerta</strong> — studi di consulenza sicurezza: {offerta.fonte.studi}. Imprese con dipendenti:{" "}
            {offerta.fonte.imprese}. Addetti: {offerta.fonte.addetti}.
          </li>
          <li>
            <strong>Domanda</strong> — {domanda.fonte.dati}. {domanda.fonte.rischio}.
          </li>
        </ul>
      </div>
    </section>
  );
}

function computeTop3Share(offertaRows: { nome: string; studi_primario: number | null }[]) {
  const totale = offertaRows.reduce((s, r) => s + (r.studi_primario ?? 0), 0);
  const top3 = [...offertaRows].sort((a, b) => (b.studi_primario ?? 0) - (a.studi_primario ?? 0)).slice(0, 3);
  const top3Sum = top3.reduce((s, r) => s + (r.studi_primario ?? 0), 0);
  return { nomi: top3.map((r) => r.nome), pct: totale > 0 ? (top3Sum / totale) * 100 : 0 };
}
