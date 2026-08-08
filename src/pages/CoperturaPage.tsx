import { useEffect, useMemo, useState } from "react";
import { NavHeader } from "../components/NavHeader";
import { QuadrantChart, QUADRANTE_COLOR } from "../components/QuadrantChart";
import { buildCopertura, QUADRANTE_LABEL, QUADRANTE_DESC, type Quadrante } from "../lib/copertura";
import { routeHref, useRouteParams } from "../lib/router";
import type { RegioniDataset } from "../lib/types";
import type { DomandaDataset } from "../lib/domandaTypes";
import "../App.css";

export function CoperturaPage() {
  const params = useRouteParams();
  const [offerta, setOfferta] = useState<RegioniDataset | null>(null);
  const [domanda, setDomanda] = useState<DomandaDataset | null>(null);
  const [selected, setSelected] = useState<string | null>(() => params.get("regione"));

  useEffect(() => {
    fetch("/data/regioni.json").then((r) => r.json()).then(setOfferta);
    fetch("/data/domanda.json").then((r) => r.json()).then(setDomanda);
  }, []);

  const { rows, medianDomanda, medianDensita } = useMemo(() => {
    if (!offerta || !domanda) return { rows: [], medianDomanda: 0, medianDensita: 0 };
    return buildCopertura(offerta.regioni, domanda.regioni);
  }, [offerta, domanda]);

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.impreseObbligate - a.impreseObbligate), [rows]);

  if (!offerta || !domanda) {
    return (
      <>
        <NavHeader active="copertura" />
        <div className="loading">
          <p>Caricamento dati...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavHeader active="copertura" />

      <header>
        <h1>Copertura del mercato: domanda vs offerta</h1>
        <div className="sub">
          Incrocio, per regione, tra la densità di studi (offerta, attività primaria) e il numero di imprese
          obbligate (domanda). Soglie: mediana nazionale di ciascuna grandezza — {Math.round(medianDomanda).toLocaleString("it")}{" "}
          imprese obbligate, densità {medianDensita.toFixed(2)} /1.000 imprese.
        </div>
      </header>

      <div className="wrap">
        <div className="card quadcard">
          <QuadrantChart
            rows={rows}
            medianDomanda={medianDomanda}
            medianDensita={medianDensita}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="quadlegend">
            {(Object.keys(QUADRANTE_LABEL) as Quadrante[]).map((q) => (
              <div className="quaditem" key={q} title={QUADRANTE_DESC[q]}>
                <span className="quaddot" style={{ background: QUADRANTE_COLOR[q] }} aria-hidden />
                {QUADRANTE_LABEL[q]}
              </div>
            ))}
          </div>
        </div>

        <div className="card rank">
          <div className="blocktitle">Classifica &middot; imprese obbligate (domanda)</div>
          <div className="datatablewrap">
            <table className="datatable">
              <thead>
                <tr>
                  <th>Regione</th>
                  <th>Imprese obbligate</th>
                  <th>Densità offerta</th>
                  <th>Domanda pesata</th>
                  <th>Quadrante</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr
                    key={r.nome}
                    className={selected === r.nome ? "sel" : undefined}
                    onClick={() => setSelected(selected === r.nome ? null : r.nome)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="datastrong">{r.nome}</td>
                    <td className="datanum">{r.impreseObbligate.toLocaleString("it")}</td>
                    <td className="datanum">{r.densitaOfferta != null ? r.densitaOfferta.toFixed(2) : "n/d"}</td>
                    <td className="datanum">{Math.round(r.domandaPesata).toLocaleString("it")}</td>
                    <td>
                      {r.quadrante ? (
                        <span className="quadbadge" style={{ color: QUADRANTE_COLOR[r.quadrante] }}>
                          <span className="quaddot" style={{ background: QUADRANTE_COLOR[r.quadrante] }} aria-hidden />
                          {QUADRANTE_LABEL[r.quadrante]}
                        </span>
                      ) : (
                        "n/d"
                      )}
                    </td>
                    <td className="datalinks">
                      <a
                        className="rowlink"
                        href={routeHref("offerta", { metric: "dens", scope: "primario", regione: r.nome })}
                        aria-label={`Apri ${r.nome} sulla mappa Offerta`}
                        title={`Apri ${r.nome} sulla mappa Offerta`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Offerta ↗
                      </a>
                      {" · "}
                      <a
                        className="rowlink"
                        href={routeHref("domanda", { metric: "imprese", regione: r.nome })}
                        aria-label={`Apri ${r.nome} sulla mappa Domanda`}
                        title={`Apri ${r.nome} sulla mappa Domanda`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Domanda ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="foot">
        Clicca un punto sul grafico o una riga in classifica per evidenziare la regione. Le soglie dei quadranti sono
        le mediane nazionali di domanda e densità di offerta, ricalcolate dai dati correnti.
      </div>
    </>
  );
}
