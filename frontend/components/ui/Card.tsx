import type { CSSProperties } from "react";

export function Card({
  children,
  style,
  className
}: {
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className ? `panel ${className}` : "panel"}
      style={{
        padding: 22,
        ...style
      }}
    >
      {children}
    </div>
  );
}
