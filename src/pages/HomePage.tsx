import { routeHref } from "../lib/router";
import { NavHeader } from "../components/NavHeader";
import { ReportSection } from "../components/ReportSection";
import "../App.css";

export function HomePage() {
  return (
    <>
      <NavHeader active="home" />
      <div className="home">
        <div className="homehero">
          <h1>Mappatura sicurezza sul lavoro in Italia</h1>
          <div className="sub">
            Tre viste sul mercato della consulenza sicurezza: chi offre, chi dovrebbe comprare, e dove l'incrocio tra
            i due lascia spazio bianco. Report dati completo più sotto.
          </div>
        </div>
        <div className="homecards">
          <a className="homecard" href={routeHref("offerta")}>
            <div className="homecardtag">Offerta</div>
            <h2>Studi di consulenza sicurezza</h2>
            <p>
              Densità di studi, numero assoluto e quota società di capitale per regione, con filtro
              primario/secondario. Fonte: Telemaco.
            </p>
            <span className="homecardcta">Apri la mappa →</span>
          </a>
          <a className="homecard" href={routeHref("domanda")}>
            <div className="homecardtag">Domanda</div>
            <h2>Imprese obbligate e rischio settoriale</h2>
            <p>
              Imprese con dipendenti, addetti e indice di rischio D.Lgs 81/08 per regione e settore. Fonte: ISTAT
              ASIA 2024.
            </p>
            <span className="homecardcta">Apri la mappa →</span>
          </a>
          <a className="homecard" href={routeHref("copertura")}>
            <div className="homecardtag">Copertura</div>
            <h2>Domanda × densità di offerta</h2>
            <p>
              Il confronto diretto: quali regioni sono presidiate e quali hanno più domanda che offerta, in un
              grafico a quadranti.
            </p>
            <span className="homecardcta">Apri il confronto →</span>
          </a>
        </div>
      </div>
      <ReportSection />
    </>
  );
}
