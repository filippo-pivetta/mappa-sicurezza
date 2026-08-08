import { routeHref, type Route } from "../lib/router";

interface Props {
  active: Route;
}

export function NavHeader({ active }: Props) {
  return (
    <nav className="navbar">
      <a className="navbrand" href={routeHref("home")}>
        Mappa sicurezza
      </a>
      <div className="navlinks">
        <a className={"navlink" + (active === "offerta" ? " on" : "")} href={routeHref("offerta")}>
          Offerta · Studi
        </a>
        <a className={"navlink" + (active === "domanda" ? " on" : "")} href={routeHref("domanda")}>
          Domanda · Mercato
        </a>
        <a className={"navlink" + (active === "copertura" ? " on" : "")} href={routeHref("copertura")}>
          Copertura · Opportunità
        </a>
      </div>
    </nav>
  );
}
