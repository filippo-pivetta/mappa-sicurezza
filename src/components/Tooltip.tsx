import type { ReactNode } from "react";

interface Props {
  x: number;
  y: number;
  title: string;
  children: ReactNode;
}

export function Tooltip({ x, y, title, children }: Props) {
  const left = Math.min(x + 14, window.innerWidth - 280);
  return (
    <div className="tip" style={{ opacity: 1, left, top: y + 14 }}>
      <b>{title}</b>
      <br />
      <span style={{ color: "#c7d5e2" }}>{children}</span>
    </div>
  );
}
