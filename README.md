# Mappatura studi sicurezza · dashboard

Dashboard interattiva che mappa il mercato degli studi di consulenza sicurezza
sul lavoro in Italia, per regione, con choropleth geografica reale (sagoma
delle 20 regioni, non tessere).

## Struttura del progetto

```
mappa-sicurezza/
├── index.html
├── public/
│   └── data/
│       ├── regioni.json                 # dati regione per regione (SOSTITUIBILE)
│       └── limits_IT_regions.topo.json  # confini geografici delle regioni (openpolis/geojson-italy)
├── src/
│   ├── App.tsx                # orchestrazione: stato metrica/selezione, layout
│   ├── App.css / index.css    # tema scuro
│   ├── components/
│   │   ├── ItalyMap.tsx       # choropleth D3 (geoMercator + geoPath su TopoJSON)
│   │   ├── MetricToggles.tsx  # toggle metriche + tooltip esplicativo
│   │   ├── DetailPanel.tsx    # pannello KPI + composizione + fasce fatturato
│   │   ├── RankList.tsx       # classifica sincronizzata con mappa/metrica
│   │   └── Tooltip.tsx
│   └── lib/
│       ├── types.ts           # schema dati regione + metrica
│       ├── metrics.ts         # definizione delle 5 metriche e calcoli a runtime
│       ├── color.ts           # rampa colore sequenziale (teal)
│       └── nameMap.ts         # normalizza i nomi regione del TopoJSON
```

## Avvio in locale

```bash
npm install
npm run dev
```

Apre su `http://localhost:5173` (o la prima porta libera).

## Build statica

```bash
npm run build
```

Genera i file statici in `dist/`, pronti per essere serviti da qualsiasi
hosting statico (Netlify, Vercel, GitHub Pages, S3, ecc.). `npm run preview`
serve la build in locale per un controllo finale.

## Aggiornare i dati

I dati vivono in `public/data/regioni.json` e vengono caricati a runtime con
una `fetch`, quindi **aggiornarli significa sostituire quel file**, senza
toccare il codice. Schema per ogni regione:

```json
{
  "nome": "Lombardia",
  "imprese_attive": 814290,
  "studi_primario": 1405,
  "studi_prim_sec": 2482,
  "capitale": 1040,
  "persona": 365,
  "sommerso": 1077,
  "bands": [44, 8, 20, 43, 37, 39, 65, 322, 225, 82, 14],
  "studi_primario_9099": null,
  "capitale_9099": null
}
```

- `imprese_attive`: denominatore (InfoCamere), sempre presente per le 20 regioni.
- `studi_primario`, `studi_prim_sec`, `capitale`, `persona`, `sommerso`, `bands`:
  `null` finché la regione non è stata rilevata su Telemaco.
- `bands`: 11 valori, stesso ordine di `fasce_fatturato` nel file (solo società
  di capitale).
- `studi_primario_9099` / `capitale_9099`: colonne predisposte per un futuro
  toggle "coorte anni '90", per ora sempre `null`.

Densità, percentuali e aggregato nazionale si ricalcolano automaticamente a
runtime (vedi `src/lib/metrics.ts`) — non serve toccare altro.

Il file `public/data/limits_IT_regions.topo.json` contiene i confini reali
delle regioni (fonte: [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy)).
Non serve aggiornarlo a meno di cambiare la fonte geografica.

## Metriche

- **Densità primario**: studi con sicurezza come attività principale ogni 1.000 imprese attive.
- **Densità prim+sec**: come sopra, includendo anche l'attività secondaria.
- **Numero studi**: valore assoluto degli studi primari.
- **% società di capitale**: quota di studi con bilancio pubblico (SRL/SpA).
- **Sommerso**: studi in più che emergono includendo l'attività secondaria.

Ogni toggle mostra, al passaggio del mouse, una spiegazione in linguaggio
semplice pensata per chi non conosce il dominio.
