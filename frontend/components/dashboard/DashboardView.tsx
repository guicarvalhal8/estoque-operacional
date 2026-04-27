"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatDateTime, formatNumber } from "../../lib/format";
import type { Category, DashboardOverview } from "../../lib/types";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { StatCard } from "../ui/StatCard";
import { StatusBadge } from "../ui/Badge";

export function DashboardView() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [dashboardResponse, categoriesResponse] = await Promise.all([
        api<DashboardOverview>("/dashboard/overview", {
          query: { search, categoryId }
        }),
        api<{ categories: Category[] }>("/categories")
      ]);
      setOverview(dashboardResponse);
      setCategories(categoriesResponse.categories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar dashboard");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, categoryId]);

  if (!overview) {
    return <Card>{error || "Carregando dashboard..."}</Card>;
  }

  return (
    <div className="page-grid">
      <Card>
        <div className="section-grid">
          <Input
            placeholder="Buscar produto no estoque"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="section-grid">
        <StatCard
          label="Itens monitorados"
          value={formatNumber(overview.summary.totalProducts, 0)}
          helper="Catalogo ativo no estoque"
        />
        <StatCard
          label="Volume em estoque"
          value={formatNumber(overview.summary.totalStockUnits)}
          helper="Soma das quantidades atuais"
        />
        <StatCard
          label="Estoque baixo"
          value={formatNumber(overview.summary.lowStockCount, 0)}
          helper="Produtos abaixo do minimo"
        />
        <StatCard
          label="Sem estoque"
          value={formatNumber(overview.summary.zeroStockCount, 0)}
          helper="Itens zerados que pedem reposicao"
        />
      </div>

      <div className="dashboard-split-grid">
        <Card>
          <div className="stack">
            <div>
              <h3 style={{ margin: 0 }}>Alertas no turno</h3>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Itens com maior risco operacional.
              </p>
            </div>
            <div className="scroll-list">
              {[...overview.zeroStockProducts, ...overview.lowStockProducts].map((product) => (
                <div
                  key={product.id}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    border: "1px solid var(--line)",
                    background:
                      product.status === "ZEROED" || product.status === "CRITICAL"
                        ? "var(--danger-soft)"
                        : "var(--warning-soft)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <div className="muted">
                        {product.category.name} · atual {formatNumber(product.currentQuantity)} {product.unit}
                      </div>
                    </div>
                    <StatusBadge status={product.status} />
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    Minimo: {formatNumber(product.minimumStock)} {product.unit}
                  </div>
                </div>
              ))}
              {!overview.lowStockProducts.length && !overview.zeroStockProducts.length ? (
                <div className="empty-state">Nenhum alerta ativo no momento.</div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <div className="stack">
            <div>
              <h3 style={{ margin: 0 }}>Ultimas movimentacoes</h3>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Historico recente com responsavel e observacao.
              </p>
            </div>
            <div className="scroll-list">
              {overview.recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "var(--surface-muted)",
                    border: "1px solid var(--line)"
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{movement.product.name}</div>
                  <div className="muted">
                    {movement.type} · {formatNumber(movement.quantity)} {movement.product.unit}
                  </div>
                  <div className="muted">{movement.user.name}</div>
                  <div className="muted">{formatDateTime(movement.occurredAt)}</div>
                  {movement.note ? <div style={{ marginTop: 6 }}>{movement.note}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="stack">
          <div>
            <h3 style={{ margin: 0 }}>Visao geral dos produtos</h3>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Resumo rapido para identificar situacao, observacoes e ultimas atualizacoes.
            </p>
          </div>

          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Atual</th>
                  <th>Minimo</th>
                  <th>Status</th>
                  <th>Observacoes</th>
                </tr>
              </thead>
              <tbody>
                {overview.catalog.map((product) => (
                  <tr key={product.id}>
                    <td data-label="Produto">
                      <strong>{product.name}</strong>
                    </td>
                    <td data-label="Categoria">{product.category.name}</td>
                    <td data-label="Atual">
                      {formatNumber(product.currentQuantity)} {product.unit}
                    </td>
                    <td data-label="Minimo">
                      {formatNumber(product.minimumStock)} {product.unit}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={product.status} />
                    </td>
                    <td data-label="Observacoes">{product.notes[0]?.content || product.observations || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {error ? <Card>{error}</Card> : null}
    </div>
  );
}
