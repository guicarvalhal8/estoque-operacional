"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { formatDateTime, formatNumber } from "../../lib/format";
import type { StockCountAnalysis, StockCountItem, StockCountSession } from "../../lib/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input } from "../ui/Input";
import { StatCard } from "../ui/StatCard";

type CountOverview = {
  sessions: StockCountSession[];
  activeSession: StockCountSession | null;
  latestAnalysis: StockCountAnalysis;
};

export function CountsView() {
  const [overview, setOverview] = useState<CountOverview | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<Record<string, { countedQuantity: string; note: string }>>({});
  const newCountRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      setError("");
      const response = await api<CountOverview>("/counts/overview");
      setOverview(response);
      if (response.activeSession) {
        const nextDraft: Record<string, { countedQuantity: string; note: string }> = {};
        response.activeSession.items.forEach((item) => {
          nextDraft[item.productId] = {
            countedQuantity:
              item.countedQuantity === null || item.countedQuantity === undefined
                ? ""
                : String(item.countedQuantity),
            note: item.note ?? ""
          };
        });
        setDraftItems(nextDraft);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar contagens");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeSession = overview?.activeSession ?? null;

  const countTotals = useMemo(() => {
    if (!activeSession) return null;
    const filled = activeSession.items.filter((item) => {
      const draft = draftItems[item.productId];
      return draft && draft.countedQuantity !== "";
    }).length;
    return {
      total: activeSession.items.length,
      filled,
      pending: activeSession.items.length - filled
    };
  }, [activeSession, draftItems]);

  const createSession = async () => {
    try {
      setCreating(true);
      await api<{ session: StockCountSession }>("/counts", {
        method: "POST",
        body: JSON.stringify({
          title,
          referenceDate,
          notes
        })
      });
      setTitle("");
      setNotes("");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Falha ao abrir contagem");
    } finally {
      setCreating(false);
    }
  };

  const saveDraft = async () => {
    if (!activeSession) return;
    try {
      setSaving(true);
      const items = activeSession.items
        .map((item) => ({
          productId: item.productId,
          countedQuantity: draftItems[item.productId]?.countedQuantity,
          note: draftItems[item.productId]?.note ?? ""
        }))
        .filter((item) => item.countedQuantity !== "")
        .map((item) => ({
          productId: item.productId,
          countedQuantity: Number(item.countedQuantity),
          note: item.note
        }));

      await api<{ session: StockCountSession }>(`/counts/${activeSession.id}/items`, {
        method: "PATCH",
        body: JSON.stringify({ items })
      });

      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar contagem");
    } finally {
      setSaving(false);
    }
  };

  const finalizeSession = async () => {
    if (!activeSession) return;
    try {
      setFinalizing(true);
      await saveDraft();
      await api<{ session: StockCountSession }>(`/counts/${activeSession.id}/finalize`, {
        method: "POST"
      });
      setConfirmOpen(false);
      await load();
    } catch (finalizeError) {
      setError(
        finalizeError instanceof Error ? finalizeError.message : "Falha ao fechar contagem"
      );
    } finally {
      setFinalizing(false);
    }
  };

  const focusNewCount = () => {
    newCountRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page-grid">
      <div className="section-grid">
        <StatCard
          label="Contagens recentes"
          value={formatNumber(overview?.sessions.length ?? 0, 0)}
          helper="Historico de fechamentos e aberturas"
        />
        <StatCard
          label="Contagem aberta"
          value={activeSession ? "Sim" : "Nao"}
          helper={activeSession ? activeSession.title : "Abra uma contagem mensal"}
        />
        <StatCard
          label="Itens preenchidos"
          value={formatNumber(countTotals?.filled ?? 0, 0)}
          helper={activeSession ? `${countTotals?.pending ?? 0} itens pendentes` : "Sem sessao aberta"}
        />
      </div>

      {!activeSession ? (
        <Card>
          <div ref={newCountRef} />
          <div className="stack">
            <div>
              <h3 style={{ margin: 0 }}>Abrir nova contagem mensal</h3>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Gere uma tabela com todos os produtos para preencher a contagem do fim do mes.
              </p>
            </div>
            <div className="section-grid">
              <Input
                placeholder="Ex.: Contagem de Abril"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Input
                type="date"
                value={referenceDate}
                onChange={(event) => setReferenceDate(event.target.value)}
              />
            </div>
            <Input
              placeholder="Observacao opcional"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <div>
              <Button onClick={() => void createSession()} disabled={creating || title.trim().length < 3}>
                {creating ? "Abrindo..." : "Abrir contagem"}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="stack">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap"
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{activeSession.title}</h3>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  Referencia: {formatDateTime(activeSession.referenceDate)} · aberta por{" "}
                  {activeSession.createdBy.name}
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => void saveDraft()} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar contagem"}
                </Button>
                <Button onClick={() => setConfirmOpen(true)} disabled={finalizing}>
                  Fechar contagem
                </Button>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table responsive-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Produto</th>
                    <th>Sistema</th>
                    <th>Contado</th>
                    <th>Diferenca</th>
                    <th>Observacao</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSession.items.map((item: StockCountItem) => {
                    const draft = draftItems[item.productId] ?? {
                      countedQuantity:
                        item.countedQuantity === null || item.countedQuantity === undefined
                          ? ""
                          : String(item.countedQuantity),
                      note: item.note ?? ""
                    };
                    const counted = draft.countedQuantity === "" ? null : Number(draft.countedQuantity);
                    const difference = counted === null ? null : counted - item.systemQuantity;

                    return (
                      <tr key={item.id}>
                        <td data-label="Categoria">{item.categoryName}</td>
                        <td data-label="Produto">{item.productName}</td>
                        <td data-label="Sistema">
                          {formatNumber(item.systemQuantity)} {item.unit}
                        </td>
                        <td data-label="Contado">
                          <Input
                            type="number"
                            step="0.001"
                            value={draft.countedQuantity}
                            onChange={(event) =>
                              setDraftItems((current) => ({
                                ...current,
                                [item.productId]: {
                                  countedQuantity: event.target.value,
                                  note: current[item.productId]?.note ?? draft.note
                                }
                              }))
                            }
                          />
                        </td>
                        <td data-label="Diferenca">
                          {difference === null ? "-" : `${difference > 0 ? "+" : ""}${formatNumber(difference)}`}
                        </td>
                        <td data-label="Observacao">
                          <Input
                            placeholder="Obs. da contagem"
                            value={draft.note}
                            onChange={(event) =>
                              setDraftItems((current) => ({
                                ...current,
                                [item.productId]: {
                                  countedQuantity:
                                    current[item.productId]?.countedQuantity ?? draft.countedQuantity,
                                  note: event.target.value
                                }
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      <div className="counts-split-grid">
        <Card>
          <div className="stack">
            <div>
              <h3 style={{ margin: 0 }}>Historico de contagens</h3>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Acompanhe aberturas, fechamentos e quantos itens foram conferidos.
              </p>
            </div>
            <div className="scroll-list">
              {overview?.sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    border: "1px solid var(--line)",
                    background: "var(--surface-muted)"
                  }}
                >
                  <strong>{session.title}</strong>
                  <div className="muted">
                    Referencia {formatDateTime(session.referenceDate)} · {session.status === "OPEN" ? "Aberta" : "Fechada"}
                  </div>
                  <div className="muted">
                    {session.summary.countedItems}/{session.summary.totalItems} itens preenchidos
                  </div>
                  {session.closedAt ? (
                    <div className="muted">Fechada em {formatDateTime(session.closedAt)}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="stack">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap"
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Analise entre as duas ultimas contagens</h3>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  Compare o periodo fechado para entender saida, reposicao e variacao de estoque.
                </p>
              </div>
              {!activeSession && overview?.latestAnalysis.available ? (
                <Button variant="secondary" onClick={focusNewCount}>
                  Abrir nova contagem
                </Button>
              ) : null}
            </div>

            {!overview?.latestAnalysis.available ? (
              <div className="empty-state">{overview?.latestAnalysis.message}</div>
            ) : (
              <>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: "var(--surface-muted)",
                    border: "1px solid var(--line)"
                  }}
                >
                  <strong>
                    {overview.latestAnalysis.period?.previousTitle} → {overview.latestAnalysis.period?.currentTitle}
                  </strong>
                  <div className="muted">
                    {overview.latestAnalysis.period?.from
                      ? `${formatDateTime(overview.latestAnalysis.period.from)} ate ${formatDateTime(overview.latestAnalysis.period.to!)}`
                      : ""}
                  </div>
                </div>

                <div className="section-grid">
                  <StatCard
                    label="Produtos analisados"
                    value={formatNumber(overview.latestAnalysis.summary?.totalCountedProducts ?? 0, 0)}
                    helper="Itens presentes na contagem fechada"
                  />
                  <StatCard
                    label="Saida no periodo"
                    value={formatNumber(overview.latestAnalysis.summary?.totalOutflowUnits ?? 0)}
                    helper="Soma de saidas e perdas"
                  />
                </div>

                <div className="equal-split-grid">
                  <div className="stack">
                    <strong>Produtos que mais sairam</strong>
                    {(overview.latestAnalysis.topOutflows ?? []).map((item) => (
                      <div key={item.productId} className="muted">
                        {item.productName}: {formatNumber(item.total)}
                      </div>
                    ))}
                  </div>
                  <div className="stack">
                    <strong>Produtos que menos sairam</strong>
                    {(overview.latestAnalysis.lowOutflows ?? []).map((item) => (
                      <div key={item.productId} className="muted">
                        {item.productName}: {formatNumber(item.total)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stack">
                  <strong>Maiores variacoes entre contagens</strong>
                  {(overview.latestAnalysis.countDifferences ?? []).slice(0, 6).map((item) => (
                    <div
                      key={item.productId}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid var(--line)",
                        background: "var(--surface-muted)"
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{item.productName}</div>
                      <div className="muted">{item.categoryName}</div>
                      <div>
                        Antes {formatNumber(item.previousCount)} · Agora {formatNumber(item.currentCount)} · Variacao{" "}
                        {item.variation > 0 ? "+" : ""}
                        {formatNumber(item.variation)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="stack">
                  <strong>Itens para olhar no pedido final</strong>
                  {(overview.latestAnalysis.replenishmentFocus ?? []).map((item) => (
                    <div key={item.productId} className="muted">
                      {item.productName} ({item.categoryName}) · atual {formatNumber(item.currentQuantity)} · minimo{" "}
                      {formatNumber(item.minimumStock)}
                    </div>
                  ))}
                </div>
                {!activeSession ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      border: "1px solid var(--line)",
                      background: "var(--surface-muted)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap"
                    }}
                  >
                    <div>
                      <strong>Quer fazer outra analise depois?</strong>
                      <div className="muted">
                        Abra uma nova contagem quando quiser comparar o proximo periodo.
                      </div>
                    </div>
                    <Button onClick={focusNewCount}>Abrir outra contagem</Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Card>
      </div>

      {error ? <Card>{error}</Card> : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Fechar contagem"
        description="Concluir esta contagem e ajustar o estoque para os valores contados?"
        details="Ao fechar, o sistema grava ajustes automaticamente e libera a analise comparativa do periodo."
        confirmLabel={finalizing ? "Fechando..." : "Fechar contagem"}
        cancelLabel="Continuar revisando"
        tone="primary"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void finalizeSession()}
      />
    </div>
  );
}
