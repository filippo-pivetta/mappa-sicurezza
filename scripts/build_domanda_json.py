#!/usr/bin/env python3
"""
Converte domanda_sicurezza_per_regione_settore.csv (ISTAT ASIA 2024, imprese
con dipendenti + addetti per regione e divisione ATECO, con rischio
basso/medio/alto secondo l'Accordo Stato-Regioni) in public/data/domanda.json,
il formato consumato dalla pagina "Domanda" della dashboard.

Uso:
    python3 scripts/build_domanda_json.py

Rigenera public/data/domanda.json ogni volta che il CSV sorgente cambia.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "domanda_sicurezza_per_regione_settore.csv"
OUT_PATH = ROOT / "public" / "data" / "domanda.json"

RISK_WEIGHT = {"basso": 1, "medio": 2, "alto": 3}

# Ordine fisso delle sezioni ATECO presenti nel dataset (B..S, alcune assenti
# perché non pertinenti/non censite in ASIA per imprese con dipendenti).
SEZIONI_ORDER = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "Q", "R", "S"]


def main():
    with CSV_PATH.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    nomi_sezione: dict[str, str] = {}
    per_regione_tot: dict[str, dict] = {}
    per_regione_div: dict[str, list] = defaultdict(list)

    for row in rows:
        regione = row["Regione"]
        if row["Livello"] == "TOTALE":
            per_regione_tot[regione] = row
        else:
            per_regione_div[regione].append(row)
            if row["Sezione"]:
                nomi_sezione[row["Sezione"]] = row["Nome_sezione"]

    sezioni = [{"sezione": s, "nome": nomi_sezione[s]} for s in SEZIONI_ORDER if s in nomi_sezione]

    regioni_out = []
    for regione in sorted(per_regione_tot):
        tot = per_regione_tot[regione]
        imprese_tot = int(tot["Imprese_con_dipendenti"])
        addetti_tot = int(tot["Addetti"])

        divisioni = per_regione_div[regione]

        risk_mix = {"basso": 0, "medio": 0, "alto": 0}
        settori_imprese = defaultdict(int)
        settori_addetti = defaultdict(int)
        weighted_risk_sum = 0

        for d in divisioni:
            imprese = int(d["Imprese_con_dipendenti"])
            addetti = int(d["Addetti"])
            rischio = d["Rischio"]
            sezione = d["Sezione"]

            risk_mix[rischio] += imprese
            weighted_risk_sum += imprese * RISK_WEIGHT[rischio]
            settori_imprese[sezione] += imprese
            settori_addetti[sezione] += addetti

        indice_rischio = weighted_risk_sum / imprese_tot if imprese_tot else 0
        quota_alto_rischio = (risk_mix["alto"] / imprese_tot * 100) if imprese_tot else 0

        regioni_out.append(
            {
                "nome": regione,
                "imprese_con_dipendenti": imprese_tot,
                "addetti": addetti_tot,
                "indice_rischio": round(indice_rischio, 3),
                "quota_alto_rischio": round(quota_alto_rischio, 2),
                "risk_mix": risk_mix,
                "settori_imprese": [settori_imprese.get(s["sezione"], 0) for s in sezioni],
                "settori_addetti": [settori_addetti.get(s["sezione"], 0) for s in sezioni],
            }
        )

    out = {
        "fonte": {
            "dati": "ISTAT ASIA 2024, imprese con dipendenti (obbligati D.Lgs 81/08) e addetti, per regione e divisione ATECO",
            "rischio": "Classificazione di rischio basso/medio/alto per divisione ATECO secondo l'Accordo Stato-Regioni",
        },
        "sezioni": sezioni,
        "regioni": regioni_out,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Scritte {len(regioni_out)} regioni, {len(sezioni)} sezioni -> {OUT_PATH}")


if __name__ == "__main__":
    main()
