"use client";

import { AppShell } from "../../components/layout/AppShell";
import { RequireAuth } from "../../components/layout/RequireAuth";
import { ProductsView } from "../../components/products/ProductsView";

export default function ProductsPage() {
  return (
    <RequireAuth>
      <AppShell
        title="Itens em Estoque"
        subtitle="Registre entradas, saidas, perdas, ajuste manual e observacoes com o menor numero de cliques."
      >
        <ProductsView />
      </AppShell>
    </RequireAuth>
  );
}

