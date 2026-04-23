import { statusLabel } from "../../lib/format";

const map: Record<string, { background: string; color: string }> = {
  NORMAL: { background: "rgba(31, 122, 82, 0.14)", color: "var(--primary-strong)" },
  LOW: { background: "var(--warning-soft)", color: "var(--warning)" },
  CRITICAL: { background: "var(--danger-soft)", color: "var(--danger)" },
  ZEROED: { background: "rgba(150, 70, 35, 0.16)", color: "#b55e29" }
};

export function StatusBadge({ status }: { status: string }) {
  const palette = map[status] ?? map.NORMAL;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: palette.background,
        color: palette.color
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

