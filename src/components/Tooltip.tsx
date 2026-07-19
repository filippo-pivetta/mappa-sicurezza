import type { ReactNode } from "react";

interface Props {
  x: number;
  y: number;
  title: string;
  children: ReactNode;
}

export function Tooltip({ x, y, title, children }: Props) {
  const maxW = Math.min(260, window.innerWidth - 24);
  const left = Math.max(12, Math.min(x + 14, window.innerWidth - maxW - 12));
  const top = Math.max(12, Math.min(y + 14, window.innerHeight - 100));
  return (
    <div className="tip" style={{ opacity: 1, left, top, maxWidth: maxW }}>
      <b>{title}</b>
      <br />
      <span style={{ color: "#c7d5e2" }}>{children}</span>
    </div>
  );
}
