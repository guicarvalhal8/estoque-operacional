"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
};

const variantStyles = {
  primary: {
    background: "var(--primary)",
    color: "#fff",
    border: "1px solid transparent"
  },
  secondary: {
    background: "var(--surface-strong)",
    color: "var(--text)",
    border: "1px solid var(--line)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--line)"
  },
  danger: {
    background: "var(--danger)",
    color: "#fff",
    border: "1px solid transparent"
  }
} as const;

export function Button({
  children,
  variant = "primary",
  fullWidth,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...variantStyles[variant],
        width: fullWidth ? "100%" : undefined,
        padding: "12px 16px",
        borderRadius: 16,
        fontWeight: 700,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        transition: "transform 160ms ease, opacity 160ms ease",
        ...style
      }}
    >
      {children}
    </button>
  );
}

