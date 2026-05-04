"use client";

import { AppShell } from "../../components/layout/AppShell";
import { RequireAuth } from "../../components/layout/RequireAuth";
import { DashboardView } from "../../components/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <AppShell
        title="Dashboard"
        subtitle="Acompanhe alertas, última movimentação, busca por produto e visão consolidada do estoque."
      >
        <DashboardView />
      </AppShell>
    </RequireAuth>
  );
}
