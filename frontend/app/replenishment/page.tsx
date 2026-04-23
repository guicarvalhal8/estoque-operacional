"use client";

import { AppShell } from "../../components/layout/AppShell";
import { RequireAuth } from "../../components/layout/RequireAuth";
import { RequireRole } from "../../components/layout/RequireRole";
import { ReplenishmentView } from "../../components/replenishment/ReplenishmentView";

export default function ReplenishmentPage() {
  return (
    <RequireAuth>
      <RequireRole allowedRoles={["ADMIN", "MANAGER"]}>
        <AppShell
          title="Reposicao"
          subtitle="Gere listas de compra automaticas, acompanhe pedidos criados e marque quando o pedido for realizado."
        >
          <ReplenishmentView />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  );
}
