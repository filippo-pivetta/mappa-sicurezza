import { useEffect, useState } from "react";

// Router minimale basato su hash (#/offerta, #/domanda) con query string per
// il deep-link a viste filtrate (#/offerta?metric=dens&scope=primario&regione=Lombardia):
// nessuna dipendenza esterna, nessuna configurazione server richiesta per il
// refresh su hosting statico.
export type Route = "home" | "offerta" | "domanda" | "copertura";

function currentHash(): string {
  return window.location.hash.replace(/^#\/?/, "");
}

function parseHash(): Route {
  const h = currentHash().split("?")[0];
  if (h === "offerta") return "offerta";
  if (h === "domanda") return "domanda";
  if (h === "copertura") return "copertura";
  return "home";
}

function parseParams(): URLSearchParams {
  const h = currentHash();
  const qIndex = h.indexOf("?");
  return new URLSearchParams(qIndex >= 0 ? h.slice(qIndex + 1) : "");
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

// Letto una volta sola al mount di una pagina (le pagine vengono smontate e
// rimontate ad ogni cambio di rotta, quindi lo stato iniziale letto
// dall'URL è sempre fresco).
export function useRouteParams(): URLSearchParams {
  const [params] = useState<URLSearchParams>(parseParams);
  return params;
}

export function routeHref(r: Route, params?: Record<string, string>): string {
  const base = r === "home" ? "#/" : `#/${r}`;
  if (!params || Object.keys(params).length === 0) return base;
  return `${base}?${new URLSearchParams(params).toString()}`;
}
