"use client";

import { useEffect, useState } from "react";
import { api, downloadFile } from "../../lib/api";
import { formatCurrency, formatDateTime, formatNumber, movementLabel, statusLabel } from "../../lib/format";
import type { Category, Product, ReportData, User } from "../../lib/types";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { StatCard } from "../ui/StatCard";

export function ReportsView() {
  const { user } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    categoryId: "",
    productId: "",
    type: "",
    userId: ""
  });
  const [error, setError] = useState("");

  const canExport = user?.role === "ADMIN" || user?.role === "MANAGER";

  const load = async () => {
    try {
      setError("");
      const [reportResponse, categoriesResponse, productsResponse, usersResponse] = await Promise.all([
        api<ReportData>("/reports/summary", {
          query: filters
        }),
        api<{ categories: Category[] }>("/categories"),
        api<{ products: Product[] }>("/products"),
        api<{ users: User[] }>("/users")
      ]);
      setReport(reportResponse);
      setCategories(categoriesResponse.categories);
      setProducts(productsResponse.products);
      setUsers(usersResponse.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar relatorios");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [filters]);

  if (!report) {
    return <Card>{error || "Carregando relatorios..."}</Card>;
  }

  const maxExit = Math.max(...report.topExits.map((item) => item.total), 1);
  const maxLoss = Math.max(...report.topLosses.map((item) => item.total), 1);

  return (
    <div className="page-grid">
      <Card>
        <div className="section-grid">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          />
          <Select
            value={filters.categoryId}
            onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            value={filters.productId}
            onChange={(event) => setFilters((current) => ({ ...current, productId: event.target.value }))}
          >
            <option value="">Todos os produtos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
          >
            <option value="">Todos os tipos</option>
            <option value="ENTRY">Entrada</option>
            <option value="EXIT">Saida</option>
            <option value="LOSS">Perda</option>
            <option value="ADJUSTMENT">Ajuste</option>
          </Select>
          <Select
            value={filters.userId}
            onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))}
          >
            <option value="">Todos os usuarios</option>
            {users.map((listedUser) => (
              <option key={listedUser.id} value={listedUser.id}>
                {listedUser.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="section-grid">
        <StatCard
          label="Estoque atual"
          value={formatNumber(report.summary.totalStockUnits)}
          helper="Volume consolidado"
        />
        <StatCard
          label="Itens baixos"
          value={formatNumber(report.summary.lowStockCount, 0)}
          helper="Abaixo do minimo"
        />
        <StatCard
          label="Criticos"
          value={formatNumber(report.summary.criticalCount, 0)}
          helper="Criticos ou zerados"
        />
        <StatCard
          label="Movimentacoes do dia"
          value={formatNumber(report.summary.movementsToday, 0)}
          helper="Fluxo operacional no periodo"
        />
      </div>

      {canExport ? (
        <Card>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button onClick={() => void downloadFile("/reports/export", "relatorio-estoque.xlsx", { ...filters, format: "xlsx" })}>
              Exportar Excel
            </Button>
            <Button variant="secondary" onClick={() => void downloadFile("/reports/export", "relatorio-estoque.pdf", { ...filters, format: "pdf" })}>
              Exportar PDF
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="reports-split-grid">
        <Card>
          <div className="stack">
            <h3 style={{ margin: 0 }}>Produtos com maior saida</h3>
            {report.topExits.map((item) => (
              <div key={item.product} className="stack">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.product}</span>
                  <strong>{formatNumber(item.total)}</strong>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "var(--surface-muted)"
                  }}
                >
                  <div
                    style={{
                      width: `${(item.total / maxExit) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #1f7a52, #7ab98b)"
                    }}
                  />
                </div>
              </div>
            ))}
            {!report.topExits.length ? <div className="empty-state">Sem saidas no periodo.</div> : null}
          </div>
        </Card>

        <Card>
          <div className="stack">
            <h3 style={{ margin: 0 }}>Produtos com mais perdas</h3>
            {report.topLosses.map((item) => (
              <div key={item.product} className="stack">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.product}</span>
                  <strong>{formatNumber(item.total)}</strong>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "var(--surface-muted)"
                  }}
                >
                  <div
                    style={{
                      width: `${(item.total / maxLoss) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #c44d3f, #ef8f82)"
                    }}
                  />
                </div>
              </div>
            ))}
            {!report.topLosses.length ? <div className="empty-state">Sem perdas no periodo.</div> : null}
          </div>
        </Card>
      </div>

      <Card>
        <div className="stack">
          <h3 style={{ margin: 0 }}>Estoque atual</h3>
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Atual</th>
                  <th>Minimo</th>
                  <th>Status</th>
                  <th>Fornecedor</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
                {report.currentStock.map((item) => (
                  <tr key={item.product}>
                    <td data-label="Produto">{item.product}</td>
                    <td data-label="Categoria">{item.category}</td>
                    <td data-label="Atual">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td data-label="Minimo">{formatNumber(item.minimumStock)}</td>
                    <td data-label="Status">{statusLabel(item.status)}</td>
                    <td data-label="Fornecedor">{item.supplier || "-"}</td>
                    <td data-label="Custo">{formatCurrency(item.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <div className="reports-split-grid">
        <Card>
          <div className="stack">
            <h3 style={{ margin: 0 }}>Movimentacoes do dia</h3>
            {report.dailyMovements.map((movement, index) => (
              <div
                key={`${movement.product}-${index}`}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: "var(--surface-muted)"
                }}
              >
                <strong>{movement.product}</strong>
                <div className="muted">
                  {movementLabel(movement.type)} · {formatNumber(movement.quantity)}
                </div>
                <div className="muted">
                  {movement.user} · {formatDateTime(movement.occurredAt)}
                </div>
                {movement.note ? <div>{movement.note}</div> : null}
              </div>
            ))}
            {!report.dailyMovements.length ? <div className="empty-state">Sem movimentacoes hoje.</div> : null}
          </div>
        </Card>

        <Card>
          <div className="stack">
            <h3 style={{ margin: 0 }}>Necessidade de reposicao</h3>
            {report.replenishmentNeed.map((item) => (
              <div
                key={item.product}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: "var(--surface-muted)"
                }}
              >
                <strong>{item.product}</strong>
                <div className="muted">{item.category}</div>
                <div>
                  Atual {formatNumber(item.currentQuantity)} · minimo {formatNumber(item.minimumStock)} · sugerido{" "}
                  {formatNumber(item.suggested)}
                </div>
              </div>
            ))}
            {!report.replenishmentNeed.length ? <div className="empty-state">Sem necessidade de reposicao.</div> : null}
          </div>
        </Card>
      </div>

      {error ? <Card>{error}</Card> : null}
    </div>
  );
}
