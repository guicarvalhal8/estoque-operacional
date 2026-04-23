"use client";

import { AppShell } from "../../components/layout/AppShell";
import { RequireAuth } from "../../components/layout/RequireAuth";
import { RequireRole } from "../../components/layout/RequireRole";
import { ReportsView } from "../../components/reports/ReportsView";

export default function ReportsPage() {
  return (
    <RequireAuth>
      <RequireRole allowedRoles={["ADMIN", "MANAGER"]}>
        <AppShell
          title="Relatorios"
          subtitle="Analise saidas, perdas, estoque atual, movimentacoes do dia e necessidade de reposicao com exportacao."
        >
          <ReportsView />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  );
}
