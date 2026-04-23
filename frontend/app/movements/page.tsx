"use client";

import { AppShell } from "../../components/layout/AppShell";
import { RequireAuth } from "../../components/layout/RequireAuth";
import { RequireRole } from "../../components/layout/RequireRole";
import { MovementsView } from "../../components/movements/MovementsView";

export default function MovementsPage() {
  return (
    <RequireAuth>
      <RequireRole allowedRoles={["ADMIN", "MANAGER"]}>
        <AppShell
          title="Historico"
          subtitle="Consulte todas as movimentacoes de estoque com filtros por periodo, produto, categoria, tipo e usuario."
        >
          <MovementsView />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  );
}
