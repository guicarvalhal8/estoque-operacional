import { Card } from "./Card";

export function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card>
      <div className="stack">
        <span className="muted">{label}</span>
        <strong className="kpi-value">{value}</strong>
        <span className="muted">{helper}</span>
      </div>
    </Card>
  );
}

