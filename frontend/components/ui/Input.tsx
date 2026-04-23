import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
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

