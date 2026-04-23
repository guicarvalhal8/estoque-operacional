"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatDateTime, formatNumber } from "../../lib/format";
import type { PurchaseOrder, ReplenishmentSuggestion } from "../../lib/types";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input } from "../ui/Input";

export function ReplenishmentView() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ReplenishmentSuggestion[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [title, setTitle] = useState("Pedido de reposicao automatico");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [orderToConfirm, setOrderToConfirm] = useState<PurchaseOrder | null>(null);

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const load = async () => {
    try {
      setError("");
      const [suggestionResponse, ordersResponse] = await Promise.all([
        api<{ suggestions: ReplenishmentSuggestion[] }>("/replenishment/suggestions"),
        api<{ orders: PurchaseOrder[] }>("/replenishment/orders")
      ]);
      setSuggestions(suggestionResponse.suggestions);
      setOrders(ordersResponse.orders);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Falha ao carregar lista de reposicao"
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createOrder = async () => {
    try {
      await api("/replenishment/orders", {
        method: "POST",
        body: JSON.stringify({ title, notes })
      });
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Falha ao criar pedido");
    }
  };

  const markOrdered = async () => {
    if (!orderToConfirm) return;
    try {
      await api(`/replenishment/orders/${orderToConfirm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ORDERED" })
      });
      setOrderToConfirm(null);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Falha ao atualizar pedido");
    }
  };

  return (
    <div className="page-grid">
      <Card>
        <div className="stack">
          <div>
            <h3 style={{ margin: 0 }}>Sugestao automatica de compra</h3>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Lista gerada com base no estoque minimo, situacao atual e prioridade de reposicao.
            </p>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Atual</th>
                  <th>Minimo</th>
                  <th>Sugerido</th>
                  <th>Fornecedor</th>
                  <th>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td>{item.categoryName}</td>
                    <td>
                      {formatNumber(item.currentQuantity)} {item.unit}
                    </td>
                    <td>{formatNumber(item.minimumStock)}</td>
                    <td>{formatNumber(item.suggestedQuantity)}</td>
                    <td>{item.supplier || "-"}</td>
                    <td>{item.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!suggestions.length ? (
              <div className="empty-state">Sem itens pendentes de reposicao.</div>
            ) : null}
          </div>
        </div>
      </Card>

      {canManage ? (
        <Card>
          <div className="stack">
            <h3 style={{ margin: 0 }}>Gerar pedido</h3>
            <div className="section-grid">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              <Input
                placeholder="Observacao opcional"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div>
              <Button onClick={() => void createOrder()} disabled={!suggestions.length}>
                Gerar pedido automatico
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="stack">
          <div>
            <h3 style={{ margin: 0 }}>Pedidos gerados</h3>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Historico de listas marcadas como pendentes ou realizadas.
            </p>
          </div>

          <div className="scroll-list">
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: 18,
                  borderRadius: 18,
                  border: "1px solid var(--line)",
                  background: "var(--surface-muted)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <strong>{order.title}</strong>
                    <div className="muted">
                      {order.createdBy.name} - {formatDateTime(order.createdAt)}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
                  >
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        background:
                          order.status === "ORDERED"
                            ? "rgba(31, 122, 82, 0.14)"
                            : "var(--warning-soft)"
                      }}
                    >
                      {order.status === "ORDERED" ? "Pedido realizado" : "Pendente"}
                    </span>
                    {canManage && order.status !== "ORDERED" ? (
                      <Button variant="secondary" onClick={() => setOrderToConfirm(order)}>
                        Marcar realizado
                      </Button>
                    ) : null}
                  </div>
                </div>

                {order.notes ? <p>{order.notes}</p> : null}

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Sugerido</th>
                        <th>Atual</th>
                        <th>Minimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.productName}</td>
                          <td>
                            {formatNumber(item.quantitySuggested)} {item.unit}
                          </td>
                          <td>{formatNumber(item.currentQuantity)}</td>
                          <td>{formatNumber(item.minimumStock)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {!orders.length ? <div className="empty-state">Nenhum pedido gerado ainda.</div> : null}
          </div>
        </div>
      </Card>

      {error ? <Card>{error}</Card> : null}

      <ConfirmDialog
        open={!!orderToConfirm}
        title="Finalizar pedido"
        description={
          orderToConfirm
            ? `Marcar "${orderToConfirm.title}" como pedido realizado?`
            : ""
        }
        details={
          orderToConfirm
            ? `${orderToConfirm.items.length} item(ns) incluidos nesta lista de reposicao.`
            : ""
        }
        confirmLabel="Marcar como realizado"
        cancelLabel="Revisar antes"
        tone="primary"
        onClose={() => setOrderToConfirm(null)}
        onConfirm={() => void markOrdered()}
      />
    </div>
  );
}

