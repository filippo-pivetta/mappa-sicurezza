import { Modal } from "./Modal";
import { RISK_TABLE } from "../lib/riskTable";

interface Props {
  onClose: () => void;
}

export function RiskTableModal({ onClose }: Props) {
  return (
    <Modal title="Tabella di rischio per settore" onClose={onClose}>
      <p className="modalintro">
        Classificazione di rischio basso/medio/alto per sezione ATECO secondo l'Accordo Stato-Regioni, con il peso
        (1/2/3) usato per calcolare l'indice di rischio pesato sul mix settoriale reale di ogni regione. Le sezioni A,
        O, T e U non compaiono tra le imprese con dipendenti rilevate da ISTAT ASIA e quindi non incidono sulle
        mappe.
      </p>
      <div className="datatablewrap">
        <table className="datatable">
          <thead>
            <tr>
              <th>Sezione</th>
              <th>Descrizione</th>
              <th>Rischio</th>
              <th>Peso</th>
            </tr>
          </thead>
          <tbody>
            {RISK_TABLE.map((r) => (
              <tr key={r.sezione}>
                <td className="datastrong">{r.sezione}</td>
                <td>{r.descrizione}</td>
                <td>
                  <span className={"riskbadge risk-" + r.rischio}>{r.rischio}</span>
                </td>
                <td className="datanum">{r.peso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
