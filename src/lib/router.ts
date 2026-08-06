import { useEffect, useState } from "react";

// Router minimale basato su hash (#/offerta, #/domanda): nessuna dipendenza
// esterna, nessuna configurazione server richiesta per il refresh su hosting
// statico.
export type Route = "home" | "offerta" | "domanda";

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  if (h === "offerta") return "offerta";
  if (h === "domanda") return "domanda";
  return "home";
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

export function routeHref(r: Route): string {
  return r === "home" ? "#/" : `#/${r}`;
}
