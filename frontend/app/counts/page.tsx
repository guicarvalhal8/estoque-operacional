"use client";

import { AppShell } from "../../components/layout/AppShell";
import { RequireAuth } from "../../components/layout/RequireAuth";
import { RequireRole } from "../../components/layout/RequireRole";
import { CountsView } from "../../components/counts/CountsView";

export default function CountsPage() {
  return (
    <RequireAuth>
      <RequireRole allowedRoles={["ADMIN", "MANAGER"]}>
        <AppShell
          title="Contagem Mensal"
          subtitle="Refaca a contagem no fim do mes, ajuste o estoque e acompanhe a analise entre as contagens fechadas."
        >
          <CountsView />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  );
}

