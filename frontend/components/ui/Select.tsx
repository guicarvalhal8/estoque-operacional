import type { SelectHTMLAttributes } from "react";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 16,
        border: "1px solid var(--line)",
        background: "var(--surface-strong)",
        color: "var(--text)"
      }}
    />
  );
}

