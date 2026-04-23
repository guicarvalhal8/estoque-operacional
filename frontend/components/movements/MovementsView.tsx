"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatDateTime, formatNumber, movementLabel } from "../../lib/format";
import type { Category, Movement, Product, User } from "../../lib/types";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export function MovementsView() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    categoryId: "",
    productId: "",
    type: "",
    userId: "",
    startDate: "",
    endDate: ""
  });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [movementResponse, categoriesResponse, productsResponse, usersResponse] = await Promise.all([
        api<{ movements: Movement[] }>("/movements", {
          query: filters
        }),
        api<{ categories: Category[] }>("/categories"),
        api<{ products: Product[] }>("/products"),
        api<{ users: User[] }>("/users")
      ]);

      setMovements(movementResponse.movements);
      setCategories(categoriesResponse.categories);
      setProducts(productsResponse.products);
      setUsers(usersResponse.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar historico");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [filters]);

  return (
    <div className="page-grid">
      <Card>
        <div className="section-grid">
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
        </div>
      </Card>

      <Card>
        <div className="stack">
          <div>
            <h3 style={{ margin: 0 }}>Historico completo</h3>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              As movimentacoes sao somente leitura e preservadas para auditoria.
            </p>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Antes</th>
                  <th>Depois</th>
                  <th>Usuario</th>
                  <th>Observacao</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatDateTime(movement.occurredAt)}</td>
                    <td>{movement.product.name}</td>
                    <td>{movementLabel(movement.type)}</td>
                    <td>
                      {formatNumber(movement.quantity)} {movement.product.unit}
                    </td>
                    <td>{formatNumber(movement.quantityBefore)}</td>
                    <td>{formatNumber(movement.quantityAfter)}</td>
                    <td>{movement.user.name}</td>
                    <td>{movement.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!movements.length ? <div className="empty-state">Nenhuma movimentacao encontrada.</div> : null}
          </div>
        </div>
      </Card>

      {error ? <Card>{error}</Card> : null}
    </div>
  );
}

