import { SCOPES } from "../lib/metrics";
import type { Scope } from "../lib/types";

interface Props {
  scope: Scope;
  onChange: (s: Scope) => void;
}

export function ScopeToggle({ scope, onChange }: Props) {
  return (
    <div className="scopewrap">
      <span className="scopelabel">Attività</span>
      <div className="scopes" role="tablist" aria-label="Filtro attività primaria/secondaria">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={scope === s.key}
            className={"sc" + (s.key === scope ? " on" : "")}
            onClick={() => onChange(s.key)}
          >
            {s.short}
          </button>
        ))}
      </div>
    </div>
  );
}
