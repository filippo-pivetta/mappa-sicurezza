# Mappatura sicurezza sul lavoro · dashboard

Dashboard interattiva in quattro pagine che mappa, per regione, il mercato
della consulenza sicurezza sul lavoro in Italia — con choropleth geografica
reale (sagoma delle 20 regioni, non tessere):

- **Home** (`#/`): landing page con i link alle tre viste, più un report dati
  completo (sintesi esecutiva, perimetro e metodo, dimensione del mercato,
  struttura di offerta e domanda, copertura e spazio bianco, limiti, fonti)
  con tabelle per regione e link di deep-link alle viste filtrate.
- **Offerta** (`#/offerta`): studi di consulenza sicurezza (dati Telemaco).
- **Domanda** (`#/domanda`): imprese obbligate D.Lgs 81/08, addetti e rischio
  settoriale (dati ISTAT ASIA 2024), inclusa la domanda pesata per rischio.
- **Copertura** (`#/copertura`): incrocio offerta/domanda per regione — un
  grafico a quadranti (densità di offerta × imprese obbligate, soglie sulla
  mediana nazionale) che classifica ogni regione come presidiata, spazio
  bianco, nicchia densa o domanda contenuta.

Il router supporta il deep-link a viste filtrate via query string sull'hash,
es. `#/offerta?metric=dens&scope=primario&regione=Lombardia` o
`#/domanda?metric=rischio&regione=Calabria`: la pagina si apre già con quella
metrica/scope/regione selezionati. Il report della Home usa questi link per
ogni riga e per ogni metrica delle sue tabelle.

## Struttura del progetto

```
mappa-sicurezza/
├── index.html
├── domanda_sicurezza_per_regione_settore.csv  # sorgente grezza della pagina Domanda
├── scripts/
│   └── build_domanda_json.py    # converte il CSV in public/data/domanda.json
├── public/
│   └── data/
│       ├── regioni.json                 # dati offerta, regione per regione (SOSTITUIBILE)
│       ├── domanda.json                 # dati domanda, generato dallo script (RIGENERABILE)
│       └── limits_IT_regions.topo.json  # confini geografici delle regioni (openpolis/geojson-italy)
├── src/
│   ├── App.tsx                 # router shell (legge l'hash e sceglie la pagina)
│   ├── App.css / index.css     # tema scuro condiviso da tutte le pagine
│   ├── pages/
│   │   ├── HomePage.tsx        # landing con i tre link + report dati
│   │   ├── OffertaPage.tsx     # dashboard offerta (studi)
│   │   ├── DomandaPage.tsx     # dashboard domanda (imprese/rischio)
│   │   └── CoperturaPage.tsx   # cross offerta/domanda: grafico a quadranti + classifica
│   ├── components/
│   │   ├── NavHeader.tsx       # header con i link Offerta/Domanda/Copertura
│   │   ├── ReportSection.tsx   # report dati della Home: sintesi, tabelle, link filtrati
│   │   ├── QuadrantChart.tsx   # grafico SVG a quadranti (domanda log-x × densità offerta y)
│   │   ├── ItalyMap.tsx        # choropleth D3 (geoMercator + geoPath su TopoJSON), generico
│   │   ├── MetricToggles.tsx   # toggle metriche + tooltip esplicativo, generico
│   │   ├── ScopeToggle.tsx     # toggle primario/secondario/totale (solo Offerta)
│   │   ├── RankList.tsx        # classifica sincronizzata con mappa/metrica, generico
│   │   ├── DetailPanel.tsx     # pannello KPI offerta (composizione + fasce fatturato)
│   │   ├── DomandaDetailPanel.tsx  # pannello KPI domanda (rischio + settori + domanda pesata)
│   │   ├── RiskTableModal.tsx  # modale con la tabella di rischio per sezione ATECO
│   │   ├── Modal.tsx           # overlay generico riusabile (chiude su ESC/backdrop)
│   │   └── Tooltip.tsx
│   └── lib/
│       ├── router.ts           # hash router minimale + query string per deep-link (nessuna dipendenza esterna)
│       ├── copertura.ts        # join offerta/domanda per regione + classificazione a quadranti (mediane)
│       ├── regionAbbr.ts       # sigle regionali condivise da mappa e grafico a quadranti
│       ├── metric.ts           # MetricDef<T,E> generico + calcolo min/max condiviso
│       ├── types.ts            # schema dati Offerta (Regione, Scope, MetricKey)
│       ├── metrics.ts          # le 4 metriche Offerta + aggregato nazionale
│       ├── domandaTypes.ts     # schema dati Domanda (RegioneDomanda, SezioneDef)
│       ├── domandaMetrics.ts   # le 4 metriche Domanda + aggregato nazionale
│       ├── riskTable.ts        # tabella di rischio per sezione ATECO (Accordo Stato-Regioni)
│       ├── color.ts            # rampa colore sequenziale (teal)
│       └── nameMap.ts          # normalizza i nomi regione del TopoJSON
```

`ItalyMap`, `RankList` e `MetricToggles` sono componenti generici (TypeScript
generics su `T`/`E`) condivisi dalle due dashboard: stesso stile garantito,
zero duplicazione del codice D3.

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
serve la build in locale per un controllo finale. Il routing è basato su
hash (`#/offerta`, `#/domanda`), quindi funziona su qualsiasi hosting statico
senza bisogno di configurare i rewrite per il refresh su rotte diverse da `/`.

## Aggiornare i dati — Offerta

I dati vivono in `public/data/regioni.json` e vengono caricati a runtime con
una `fetch`, quindi **aggiornarli significa sostituire quel file**, senza
toccare il codice. Schema per ogni regione:

```json
{
  "nome": "Lombardia",
  "imprese_con_dipendenti": 271028,
  "numero_addetti": 4041671,
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

- `imprese_con_dipendenti`: denominatore (InfoCamere/Movimprese, sole imprese
  CON dipendenti, non il totale imprese attive), sempre presente per le 20
  regioni.
- `numero_addetti`: addetti totali del settore (dipendenti + indipendenti,
  media annua), sempre presente per le 20 regioni.
- `studi_primario`, `studi_prim_sec`, `capitale`, `persona`, `sommerso`, `bands`:
  `null` finché la regione non è stata rilevata su Telemaco.
- `bands`: 11 valori, stesso ordine di `fasce_fatturato` nel file (solo società
  di capitale).
- `studi_primario_9099` / `capitale_9099`: colonne predisposte per un futuro
  toggle "coorte anni '90", per ora sempre `null`.

Densità, percentuali e aggregato nazionale si ricalcolano automaticamente a
runtime (vedi `src/lib/metrics.ts`) — non serve toccare altro.

### Metriche Offerta

Un toggle **Attività** (Primario / Secondario / Primario + Secondario) sceglie
quale sottoinsieme di studi considerare; le 4 metriche sotto si ricalcolano di
conseguenza (tranne la quota società di capitale, disponibile solo per
l'attività primaria):

- **Densità**: studi ogni 1.000 imprese con dipendenti.
- **Numero studi**: valore assoluto.
- **% società di capitale**: quota di studi con bilancio pubblico (SRL/SpA), sempre riferita all'attività primaria.
- **Densità per addetti**: come la densità, ma ogni 1.000 addetti anziché ogni 1.000 imprese.

## Aggiornare i dati — Domanda

I dati vivono in `public/data/domanda.json`, **generato** dal CSV sorgente
`domanda_sicurezza_per_regione_settore.csv` (ISTAT ASIA 2024: imprese con
dipendenti e addetti per regione e divisione ATECO, con rischio
basso/medio/alto secondo l'Accordo Stato-Regioni). Per aggiornare i dati,
sostituisci il CSV e rilancia lo script:

```bash
python3 scripts/build_domanda_json.py
```

Il CSV atteso ha le colonne `Regione, Cod_ATECO, Descrizione, Livello,
Sezione, Nome_sezione, Rischio, Imprese_con_dipendenti, Addetti, Anno`, con
una riga `TOTALE` per regione (denominatore) più una riga `DIVISIONE` per
ogni codice ATECO a 2 cifre.

### Metriche Domanda

- **Imprese obbligate**: imprese con dipendenti della regione (obbligati D.Lgs 81/08).
- **Addetti**: lavoratori totali nelle imprese con dipendenti.
- **Indice di rischio**: media dei pesi di rischio (basso 1, medio 2, alto 3) pesata sul mix settoriale reale della regione.
- **Quota alto rischio**: quota di imprese in settori classificati a rischio ALTO.

Il pannello di dettaglio mostra anche la composizione per rischio (basso/medio/alto) e la distribuzione delle imprese per macro-settore (sezione ATECO). L'icona **ⓘ** accanto a "Composizione per rischio" apre un modale con la tabella completa di rischio per sezione ATECO (21 sezioni A-U, `src/lib/riskTable.ts`) secondo l'Accordo Stato-Regioni: è la classificazione di riferimento da cui derivano indice di rischio e quota alto rischio.

Il file `public/data/limits_IT_regions.topo.json` contiene i confini reali
delle regioni (fonte: [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy)).
Non serve aggiornarlo a meno di cambiare la fonte geografica.

Ogni toggle metrica mostra, al passaggio del mouse, una spiegazione in
linguaggio semplice pensata per chi non conosce il dominio.
