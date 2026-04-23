import type { CSSProperties } from "react";

export function Card({
  children,
  style
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className="panel"
      style={{
        padding: 22,
        ...style
      }}
    >
      {children}
    </div>
  );
}

