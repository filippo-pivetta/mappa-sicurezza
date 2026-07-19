// Normalizza i nomi delle regioni per agganciare i nomi del TopoJSON
// (che includono varianti come "Trentino-Alto Adige/Südtirol") ai nomi del dataset.
export function normalizeRegionName(raw: string): string {
  const first = raw.split("/")[0].trim();
  const OVERRIDES: Record<string, string> = {
    "Valle d'Aosta": "Valle d'Aosta",
    "Trentino-Alto Adige": "Trentino-Alto Adige",
  };
  return OVERRIDES[first] ?? first;
}
