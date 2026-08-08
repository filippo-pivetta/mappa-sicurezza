import { useEffect, useMemo, useState } from "react";
import { routeHref } from "../lib/router";
import { nationalAggregate, stimaFatturato } from "../lib/metrics";
import { nationalAggregateDomanda } from "../lib/domandaMetrics";
import { RISK_TABLE } from "../lib/riskTable";
import { buildCopertura, QUADRANTE_LABEL } from "../lib/copertura";
import { QuadrantChart, QUADRANTE_COLOR, type QuadrantHover } from "./QuadrantChart";
import { BarCell } from "./BarCell";
import { Tooltip } from "./Tooltip";
import { sequentialColorAlpha, riskBucket } from "../lib/color";
import type { RegioniDataset } from "../lib/types";
import type { DomandaDataset } from "../lib/domandaTypes";

export function ReportSection() {
  const [offerta, setOfferta] = useState<RegioniDataset | null>(null);
  const [domanda, setDomanda] = useState<DomandaDataset | null>(null);
  const [quadSel, setQuadSel] = useState<string | null>(null);
  const [quadHover, setQuadHover] = useState<QuadrantHover | null>(null);

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

  const spazioBiancoTop = copertura.rows
    .filter((r) => r.quadrante === "spazioBianco")
    .sort((a, b) => b.impreseObbligate - a.impreseObbligate);

  const presidiatiTop = copertura.rows
    .filter((r) => r.quadrante === "presidiato")
    .sort((a, b) => (b.densitaOfferta as number) - (a.densitaOfferta as number));

  const nicchiaTop = copertura.rows
    .filter((r) => r.quadrante === "nicchia")
    .sort((a, b) => (b.densitaOfferta as number) - (a.densitaOfferta as number));

  const maxDomandaRow = [...copertura.rows].sort((a, b) => b.impreseObbligate - a.impreseObbligate)[0];

  const top4Settori = settoriNazionali.slice(0, 4);
  const manifattura = settoriNazionali.find((s) => s.sezione === "C");

  const top5Offerta = offertaRows.slice(0, 5);
  const capitaleRows = offertaRows
    .map((r) => ({
      nome: r.nome,
      pct: r.capitale != null && r.studi_primario ? (r.capitale / r.studi_primario) * 100 : null,
    }))
    .filter((r): r is { nome: string; pct: number } => r.pct != null)
    .sort((a, b) => b.pct - a.pct);
  const capitaleAlte = capitaleRows.slice(0, 2);
  const capitaleBasse = [...capitaleRows].reverse().slice(0, 2);

  const fatturatoStima = stimaFatturato(offertaTot.bands ?? []);

  const maxStudiPrimario = Math.max(...offertaRows.map((r) => r.studi_primario ?? 0), 1);
  const maxImpreseOfferta = Math.max(...offertaRows.map((r) => r.imprese_con_dipendenti), 1);
  const densOffertaVals = offertaRows.map((r) => ((r.studi_primario ?? 0) / r.imprese_con_dipendenti) * 1000);
  const maxDensOfferta = Math.max(...densOffertaVals, 0.01);
  const minDensOfferta = Math.min(...densOffertaVals, 0);
  const maxImpreseObbligate = Math.max(...domandaRows.map((r) => r.imprese_con_dipendenti), 1);
  const maxImpreseSettore = Math.max(...settoriNazionali.map((s) => s.imprese), 1);
  const altoRischioMin = Math.min(...domandaRows.map((r) => r.quota_alto_rischio), 0);
  const altoRischioMax = Math.max(...domandaRows.map((r) => r.quota_alto_rischio), 1);
  const altoRischioMinRow = [...domandaRows].sort((a, b) => a.quota_alto_rischio - b.quota_alto_rischio)[0];
  const altoRischioMaxRow = [...domandaRows].sort((a, b) => b.quota_alto_rischio - a.quota_alto_rischio)[0];

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
            Il mercato della consulenza sicurezza sul lavoro conta{" "}
            <strong>{(offertaTot.studi_primario ?? 0).toLocaleString("it")}</strong> studi con la sicurezza come
            attività principale (codici ATECO 74.99.21 e 74.99.29), che salgono a{" "}
            <strong>{(offertaTot.studi_prim_sec ?? 0).toLocaleString("it")}</strong> includendo chi la esercita come
            attività secondaria: quasi il doppio (×{sommersoMult.toFixed(1)}), segno di un forte sommerso sotto altri
            codici. Dal lato della domanda, gli obbligati del D.Lgs 81/08 sono circa{" "}
            {(domandaTot.imprese_con_dipendenti / 1_000_000).toFixed(1)} milioni di imprese con dipendenti, per{" "}
            {(domandaTot.addetti / 1_000_000).toFixed(1)} milioni di addetti. La densità nazionale è di{" "}
            {denspTot.toFixed(2)} studi ogni mille imprese obbligate.
          </p>
          <p className="reportpara">
            L'offerta è un tessuto di micro-studi: il {pctCapTot.toFixed(0)}% è società di capitale, il resto sono
            ditte individuali e società di persone senza bilancio pubblico. La domanda è concentrata nel commercio e
            nei servizi, ma il {domandaTot.quota_alto_rischio.toFixed(0)}% delle imprese obbligate opera in settori ad
            alto rischio (manifattura, costruzioni, sanità), dove il fabbisogno di sicurezza per impresa è maggiore.
            L'indice di rischio settoriale è quasi uniforme tra regioni (da {rischioMin.toFixed(2)} a{" "}
            {rischioMax.toFixed(2)} su una scala 1-3): la pericolosità non discrimina i territori, lo fa il volume di
            imprese.
          </p>
          <p className="reportpara">
            Incrociando offerta e domanda emergono regioni con domanda elevata e densità di studi sotto la media
            nazionale — in particolare {spazioBiancoTop.map((r) => r.nome).join(", ")} — e regioni dove il mercato è
            già presidiato, come {presidiatiTop.slice(0, 3).map((r) => r.nome).join(", ")}. Dettaglio nella sezione
            "Copertura e spazio bianco".
          </p>
        </div>

        <h3 className="reportsectiontitle">Copertura e spazio bianco</h3>
        <div className="card hero">
          <p className="reportpara">
            Incrocio tra densità di offerta e dimensione della domanda per regione, rispetto alle mediane nazionali (
            {Math.round(copertura.medianDomanda).toLocaleString("it")} imprese obbligate,{" "}
            {copertura.medianDensita.toFixed(2)} studi/1.000 imprese di densità). Le regioni con domanda sopra la
            mediana e densità sotto la mediana — {spazioBiancoTop.map((r) => r.nome).join(", ")} — hanno il maggior
            numero di imprese obbligate per studio attivo tra le regioni ad alta domanda.
          </p>
          {maxDomandaRow && (
            <p className="reportpara">
              {maxDomandaRow.nome} guida sia la domanda sia la densità di offerta (
              {maxDomandaRow.densitaOfferta != null ? maxDomandaRow.densitaOfferta.toFixed(2) : "n/d"} studi/1.000
              imprese), segno di un mercato già affollato in valore assoluto. All'opposto,{" "}
              {nicchiaTop.slice(0, 2).map((r) => r.nome).join(" e ")} mostrano densità alte su bacini piccoli: mercati
              locali già ben serviti in proporzione.
            </p>
          )}
          <QuadrantChart
            rows={copertura.rows}
            medianDomanda={copertura.medianDomanda}
            medianDensita={copertura.medianDensita}
            selected={quadSel}
            onSelect={setQuadSel}
            onHover={setQuadHover}
          />
          <div className="quadlegend">
            {(Object.keys(QUADRANTE_LABEL) as (keyof typeof QUADRANTE_LABEL)[]).map((q) => (
              <div className="quaditem" key={q}>
                <span className="quaddot" style={{ background: QUADRANTE_COLOR[q] }} aria-hidden />
                {QUADRANTE_LABEL[q]}
              </div>
            ))}
            <div className="quaditem">
              <span
                className="quaddot"
                style={{ background: "linear-gradient(90deg, var(--risk-basso), var(--risk-medio), var(--risk-alto))" }}
                aria-hidden
              />
              Colore punto = quota alto rischio &middot; dimensione = numero studi
            </div>
          </div>
          <p className="reportnote">
            La lettura di questi dati come priorità commerciale resta una decisione strategica: la densità indica dove
            c'è meno concorrenza per impresa, non tiene conto della propensione a esternalizzare né della qualità dei
            concorrenti presenti. Vedi la classifica completa e il grafico interattivo nella scheda{" "}
            <a className="qlink" href={routeHref("copertura")}>
              Copertura · Opportunità
            </a>
            .
          </p>
        </div>
        {quadHover && (
          <Tooltip x={quadHover.x} y={quadHover.y} title={quadHover.row.nome}>
            Imprese obbligate: {quadHover.row.impreseObbligate.toLocaleString("it")}
            <br />
            Densità offerta: {quadHover.row.densitaOfferta != null ? quadHover.row.densitaOfferta.toFixed(2) : "n/d"}
            <br />
            Quota alto rischio: {quadHover.row.quotaAltoRischio.toFixed(0)}% &middot; Studi:{" "}
            {quadHover.row.studiPrimario ?? "n/d"}
          </Tooltip>
        )}

        <h3 className="reportsectiontitle">Letture per regione</h3>
        <div className="card">
          <p className="reportpara">
            Aggregando le due dimensioni si distinguono tre profili. I <strong>mercati presidiati</strong>, con
            densità sopra la mediana, sono guidati da {presidiatiTop.slice(0, 3).map((r) => r.nome).join(", ")}, dove
            la concorrenza per cliente è più intensa. I <strong>mercati di volume non saturi</strong>, con domanda
            grande e densità sotto la mediana, sono {spazioBiancoTop.map((r) => r.nome).join(", ")}: è qui che si
            concentra il potenziale non ancora coperto. I <strong>mercati piccoli e serviti</strong>, con bacini
            ridotti ma densità alta, come {nicchiaTop.slice(0, 3).map((r) => r.nome).join(", ")}, offrono meno spazio
            in proporzione. Il rischio settoriale, uniforme, non ribalta questa lettura: incide semmai sul valore del
            singolo cliente, più alto dove pesano manifattura e costruzioni, non sulla scelta del territorio.
          </p>
        </div>

        <h3 className="reportsectiontitle">Perimetro e metodo</h3>
        <div className="card">
          <p className="reportpara">
            L'analisi mette a confronto due lati. L'<strong>offerta</strong> è l'insieme degli studi che erogano
            consulenza sicurezza, identificati sul Registro Imprese via Telemaco con i codici ATECO 74.99.21 e
            74.99.29, sedi d'impresa attive, letti sia come attività primaria sia includendo la secondaria. La{" "}
            <strong>domanda</strong> è l'insieme delle imprese soggette agli obblighi del D.Lgs 81/08, approssimata
            con le imprese attive che hanno almeno un dipendente (fonte ISTAT ASIA 2024), perché l'obbligo scatta con
            la presenza di lavoratori. A ogni settore ATECO è associata la classe di <strong>rischio</strong> presunto
            (basso, medio, alto) dell'Accordo Stato-Regioni del 21 dicembre 2011, che gradua l'intensità del
            fabbisogno di sicurezza.
          </p>
        </div>

        <h3 className="reportsectiontitle">Dimensione del mercato</h3>
        <div className="card">
          <p className="reportpara">
            Lato offerta, gli studi con la sicurezza come attività principale sono{" "}
            {(offertaTot.studi_primario ?? 0).toLocaleString("it")}. Considerando anche chi la dichiara come attività
            secondaria si arriva a {(offertaTot.studi_prim_sec ?? 0).toLocaleString("it")} soggetti: la differenza di{" "}
            {(offertaTot.sommerso ?? 0).toLocaleString("it")} è il mercato sommerso, cioè operatori iscritti
            primariamente sotto ingegneria, consulenza tecnica o gestionale che fanno anche sicurezza. Il numero
            ufficiale sottostima quindi in modo rilevante gli attori reali.
          </p>
          <p className="reportpara">
            Lato domanda, le imprese obbligate sono {domandaTot.imprese_con_dipendenti.toLocaleString("it")}, con{" "}
            {domandaTot.addetti.toLocaleString("it")} addetti complessivi. Il rapporto tra i due lati fissa la
            densità nazionale a {denspTot.toFixed(2)} studi ogni mille imprese obbligate, che è la misura di copertura
            del mercato.
          </p>
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
            L'offerta è frammentata e a bassa strutturazione. Il {pctCapTot.toFixed(0)}% degli studi a codice primario
            è società di capitale (SRL, SpA), quindi con bilancio depositato e in parte analizzabile; il restante{" "}
            {(100 - pctCapTot).toFixed(0)}% sono ditte individuali e società di persone, opache perché non depositano
            dati economici. Includendo l'attività secondaria il numero di studi sale di {sommersoMult.toFixed(2)}× (
            {(offertaTot.sommerso ?? 0).toLocaleString("it")} in più).
          </p>
          <p className="reportpara">
            La quota di società di capitale varia molto tra territori: alta in{" "}
            {capitaleAlte.map((r) => `${r.nome} (${r.pct.toFixed(0)}%)`).join(" e ")}, bassa in{" "}
            {capitaleBasse.map((r) => `${r.nome} (${r.pct.toFixed(0)}%)`).join(" e ")}. In assoluto l'offerta si
            concentra dove è concentrata l'economia: {top5Offerta.map((r) => `${r.nome} (${(r.studi_primario ?? 0).toLocaleString("it")} studi primari)`).join(", ")}
            . Le prime 3 regioni per numero di studi ({top3ShareOfferta.nomi.join(", ")}) coprono il{" "}
            {top3ShareOfferta.pct.toFixed(0)}% degli studi primari nazionali.
          </p>
          <div className="kpis">
            <div className="kpi">
              <div className="n">{fmtEuro(fatturatoStima.totale)}</div>
              <div className="l">Fatturato aggregato stimato (società di capitale, primario)</div>
            </div>
            <div className="kpi">
              <div className="n">{fmtEuro(fatturatoStima.mediaPerStudio)}</div>
              <div className="l">Fatturato medio per studio (fascia nota)</div>
            </div>
          </div>
          <p className="reportnote">
            Stima ottenuta dal punto medio di ogni fascia di fatturato per il numero di studi che vi ricade (
            {fatturatoStima.nStudi.toLocaleString("it")} società di capitale con bilancio classificabile in fascia, su{" "}
            {(offertaTot.studi_primario ?? 0).toLocaleString("it")} studi primari totali). È una stima per difetto:
            esclude le ditte individuali e società di persone (senza bilancio pubblico) e gli operatori che fanno
            sicurezza come attività secondaria — segmenti per cui non è disponibile alcun dato di fatturato.
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
                      <td className="datanum">
                        <BarCell
                          value={r.imprese_con_dipendenti}
                          max={maxImpreseOfferta}
                          color="var(--accent)"
                          formatted={r.imprese_con_dipendenti.toLocaleString("it")}
                        />
                      </td>
                      <td className="datanum">{r.numero_addetti.toLocaleString("it")}</td>
                      <td className="datanum">
                        <BarCell
                          value={r.studi_primario ?? 0}
                          max={maxStudiPrimario}
                          color="var(--accent)"
                          formatted={(r.studi_primario ?? 0).toLocaleString("it")}
                        />
                      </td>
                      <td className="datanum">{(r.studi_prim_sec ?? 0).toLocaleString("it")}</td>
                      <td
                        className="datanum heatcell"
                        style={{
                          background: sequentialColorAlpha(
                            maxDensOfferta > minDensOfferta ? (dens - minDensOfferta) / (maxDensOfferta - minDensOfferta) : 0.5,
                            0.16,
                          ),
                        }}
                      >
                        <BarCell value={dens} max={maxDensOfferta} min={minDensOfferta} color="var(--accent)" formatted={dens.toFixed(2)} />
                      </td>
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
            La domanda per numero di imprese è dominata dai settori a basso rischio: {top4Settori[0]?.nome} è la
            sezione più numerosa ({top4Settori[0]?.pct.toFixed(1)}% delle imprese obbligate), seguita da{" "}
            {top4Settori
              .slice(1)
              .map((s) => `${s.nome} (${s.pct.toFixed(1)}%)`)
              .join(", ")}
            . I settori ad alto rischio pesano insieme circa un terzo delle imprese obbligate ({domandaTot.quota_alto_rischio.toFixed(0)}
            % a livello nazionale). In termini di addetti il peso dei settori industriali cresce, perché sono
            mediamente più grandi: {manifattura ? `la ${manifattura.nome.toLowerCase()} da sola conta ${(manifattura.addetti / 1_000_000).toFixed(1)} milioni di addetti` : "la manifattura pesa molto di più in addetti che in numero di imprese"}.
          </p>
          <p className="reportpara">
            L'indice di rischio settoriale, media dei pesi di rischio ponderata sul mix di ogni regione, si muove in
            una fascia stretta, da {rischioMin.toFixed(2)} in {[...domandaRows].sort((a, b) => a.indice_rischio - b.indice_rischio)[0]?.nome} a{" "}
            {rischioMax.toFixed(2)} in {[...domandaRows].sort((a, b) => b.indice_rischio - a.indice_rischio)[0]?.nome} su una scala 1-3. La
            quota di imprese in settori ad alto rischio va dal {altoRischioMinRow?.quota_alto_rischio.toFixed(0)}% del{" "}
            {altoRischioMinRow?.nome} al {altoRischioMaxRow?.quota_alto_rischio.toFixed(0)}% del{" "}
            {altoRischioMaxRow?.nome}, contro una media nazionale del {domandaTot.quota_alto_rischio.toFixed(0)}%. La
            conseguenza è che la composizione di rischio non differenzia molto i territori: a distinguere la domanda è
            soprattutto il volume di imprese e addetti, non la loro pericolosità relativa.
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
                {domandaRows.map((r) => {
                  const bucketRischio = riskBucket(r.indice_rischio, rischioMin, rischioMax);
                  const bucketAlto = riskBucket(r.quota_alto_rischio, altoRischioMin, altoRischioMax);
                  return (
                  <tr key={r.nome}>
                    <td className="datastrong">{r.nome}</td>
                    <td className="datanum">
                      <BarCell
                        value={r.imprese_con_dipendenti}
                        max={maxImpreseObbligate}
                        color="var(--accent)"
                        formatted={r.imprese_con_dipendenti.toLocaleString("it")}
                      />
                    </td>
                    <td className="datanum">{r.addetti.toLocaleString("it")}</td>
                    <td className="datanum">
                      <span className={"riskbadge risk-" + bucketRischio}>
                        {r.indice_rischio.toFixed(2)} · {bucketRischio}
                      </span>
                    </td>
                    <td className="datanum">
                      <span className={"riskbadge risk-" + bucketAlto}>
                        {r.quota_alto_rischio.toFixed(0)}% · {bucketAlto}
                      </span>
                    </td>
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
                  );
                })}
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
                  <tr key={s.sezione} className={s.rischio ? "riskrow-" + s.rischio : undefined}>
                    <td className="datastrong">{s.sezione}</td>
                    <td>{s.nome}</td>
                    <td className="datanum">
                      <BarCell
                        value={s.imprese}
                        max={maxImpreseSettore}
                        color="var(--accent)"
                        formatted={s.imprese.toLocaleString("it")}
                      />
                    </td>
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

        <h3 className="reportsectiontitle">Limiti dell'analisi</h3>
        <div className="card">
          <p className="reportpara">I dati vanno letti con quattro cautele.</p>
          <ul className="reportsources">
            <li>
              Il codice ATECO è autodichiarato e non misura il peso reale dell'attività: un operatore può fare
              sicurezza pur avendola come secondaria, o averla come primaria facendone poca. Da qui il dato
              "prim+sec" e il "sommerso" a integrazione del solo codice primario.
            </li>
            <li>
              La classe di rischio è presunta per settore (divisione ATECO) e non coincide con il rischio reale
              dell'azienda, che è stabilito dal suo DVR — è una stima di mix settoriale, non una misura diretta.
            </li>
            <li>
              La propensione a esternalizzare non è misurabile dai dati pubblici: non tutte le imprese obbligate
              comprano da uno studio, e le più grandi tendono a internalizzare l'RSPP.
            </li>
            <li>
              Il conteggio degli studi è sulla sede legale, che non coincide con l'area effettivamente servita,
              poiché gli operatori più strutturati lavorano su più regioni.
            </li>
          </ul>
        </div>

        <h3 className="reportsectiontitle">Fonti e metodologia</h3>
        <div className="card">
          <ul className="reportsources">
            <li>
              <strong>Offerta</strong> — studi di consulenza sicurezza: {offerta.fonte.studi}, letti sia come attività
              primaria sia come primaria più secondaria. Imprese con dipendenti: {offerta.fonte.imprese}. Addetti:{" "}
              {offerta.fonte.addetti}.
            </li>
            <li>
              <strong>Domanda</strong> — {domanda.fonte.dati}.
            </li>
            <li>
              <strong>Classe di rischio</strong> — {domanda.fonte.rischio} del 21 dicembre 2011 (Allegato 2), mappata
              a livello di sezione ATECO.
            </li>
            <li>
              <strong>Densità</strong> — studi con codice primario ogni mille imprese obbligate.{" "}
              <strong>Indice di rischio</strong> — media dei pesi di rischio (basso 1, medio 2, alto 3) ponderata sul
              mix settoriale regionale.
            </li>
          </ul>
        </div>
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

function fmtEuro(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(".", ",") + " mld €";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + " mln €";
  if (v >= 1_000) return Math.round(v / 1_000).toLocaleString("it") + "k €";
  return Math.round(v).toLocaleString("it") + " €";
}
