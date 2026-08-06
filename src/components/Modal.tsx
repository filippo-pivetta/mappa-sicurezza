import { useEffect, type ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div
        className="modalpanel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modalhead">
          <h3>{title}</h3>
          <button type="button" className="modalclose" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modalbody">{children}</div>
      </div>
    </div>
  );
}
