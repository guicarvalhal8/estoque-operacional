"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatCurrency, formatDateTime, formatNumber } from "../../lib/format";
import type { Category, Product, ProductStatus } from "../../lib/types";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Modal } from "../ui/Modal";
import { ConfirmDialog } from "../ui/ConfirmDialog";

type ProductFormState = {
  id?: string;
  name: string;
  categoryId: string;
  currentQuantity: string;
  unit: string;
  minimumStock: string;
  observations: string;
  supplier: string;
  estimatedCost: string;
  restockPriority: string;
};

type MovementFormState = {
  productId: string;
  type: "ENTRY" | "EXIT" | "LOSS" | "ADJUSTMENT";
  quantity: string;
  countedQuantity: string;
  note: string;
};

const initialProductForm: ProductFormState = {
  name: "",
  categoryId: "",
  currentQuantity: "0",
  unit: "un",
  minimumStock: "0",
  observations: "",
  supplier: "",
  estimatedCost: "",
  restockPriority: "2"
};

const initialMovementForm: MovementFormState = {
  productId: "",
  type: "EXIT",
  quantity: "1",
  countedQuantity: "",
  note: ""
};

export function ProductsView() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [error, setError] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(initialProductForm);
  const [movementForm, setMovementForm] = useState<MovementFormState>(initialMovementForm);
  const [noteTarget, setNoteTarget] = useState<{ id: string; name: string } | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [quickActionTarget, setQuickActionTarget] = useState<Product | null>(null);

  const canEditProducts = user?.role === "ADMIN" || user?.role === "MANAGER";

  const load = async () => {
    try {
      setError("");
      const [productsResponse, categoriesResponse] = await Promise.all([
        api<{ products: Product[] }>("/products", {
          query: { search, categoryId, status }
        }),
        api<{ categories: Category[] }>("/categories")
      ]);

      setProducts(productsResponse.products);
      setCategories(categoriesResponse.categories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar itens");
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
  }, [search, categoryId, status]);

  const openCreateProduct = () => {
    setProductForm(initialProductForm);
    setProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      categoryId: product.category.id,
      currentQuantity: String(product.currentQuantity),
      unit: product.unit,
      minimumStock: String(product.minimumStock),
      observations: product.observations,
      supplier: product.supplier,
      estimatedCost: product.estimatedCost === null ? "" : String(product.estimatedCost),
      restockPriority: String(product.restockPriority)
    });
    setProductModalOpen(true);
  };

  const openMovement = (
    product: Product,
    type: MovementFormState["type"],
    defaults?: Partial<MovementFormState>
  ) => {
    setMovementForm({
      productId: product.id,
      type,
      quantity: defaults?.quantity ?? (type === "ADJUSTMENT" ? "" : "1"),
      countedQuantity: defaults?.countedQuantity ?? "",
      note: defaults?.note ?? ""
    });
    setMovementModalOpen(true);
  };

  const submitProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        categoryId: productForm.categoryId,
        currentQuantity: Number(productForm.currentQuantity),
        unit: productForm.unit,
        minimumStock: Number(productForm.minimumStock),
        observations: productForm.observations,
        supplier: productForm.supplier,
        estimatedCost: productForm.estimatedCost ? Number(productForm.estimatedCost) : undefined,
        restockPriority: Number(productForm.restockPriority)
      };

      if (productForm.id) {
        await api(`/products/${productForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await api("/products", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setProductModalOpen(false);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao salvar produto");
    }
  };

  const submitMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api("/movements", {
        method: "POST",
        body: JSON.stringify({
          productId: movementForm.productId,
          type: movementForm.type,
          quantity: movementForm.quantity ? Number(movementForm.quantity) : undefined,
          countedQuantity: movementForm.countedQuantity
            ? Number(movementForm.countedQuantity)
            : undefined,
          note: movementForm.note
        })
      });

      setMovementModalOpen(false);
      await load();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Falha ao registrar movimentacao"
      );
    }
  };

  const submitNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!noteTarget) return;
    try {
      await api(`/products/${noteTarget.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: noteContent })
      });

      setNoteModalOpen(false);
      setNoteTarget(null);
      setNoteContent("");
      await load();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Falha ao adicionar observacao"
      );
    }
  };

  const quickDecrease = async () => {
    if (!quickActionTarget) return;
    try {
      await api("/movements", {
        method: "POST",
        body: JSON.stringify({
          productId: quickActionTarget.id,
          type: "EXIT",
          quantity: 1,
          note: `Saida rapida de 1 unidade de ${quickActionTarget.name}`
        })
      });
      setQuickActionTarget(null);
      await load();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Falha na baixa rapida"
      );
    }
  };

  return (
    <div className="page-grid">
      <Card>
        <div className="section-grid">
          <Input
            placeholder="Buscar por produto"
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
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus | "")}
          >
            <option value="">Todos os status</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Baixo</option>
            <option value="CRITICAL">Critico</option>
            <option value="ZEROED">Zerado</option>
          </Select>
          {canEditProducts ? <Button onClick={openCreateProduct}>Novo produto</Button> : <div />}
        </div>
      </Card>

      <div className="products-grid">
        {products.map((product) => (
          <Card key={product.id}>
            <div className="stack">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start"
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{product.name}</h3>
                  <div className="muted">{product.category.name}</div>
                </div>
                <StatusBadge status={product.status} />
              </div>

              <div className="product-meta-grid">
                <div>
                  <div className="muted">Atual</div>
                  <strong>
                    {formatNumber(product.currentQuantity)} {product.unit}
                  </strong>
                </div>
                <div>
                  <div className="muted">Minimo</div>
                  <strong>
                    {formatNumber(product.minimumStock)} {product.unit}
                  </strong>
                </div>
                <div>
                  <div className="muted">Fornecedor</div>
                  <strong>{product.supplier || "-"}</strong>
                </div>
                <div>
                  <div className="muted">Custo estimado</div>
                  <strong>{formatCurrency(product.estimatedCost)}</strong>
                </div>
              </div>

              <div className="muted">
                Ultima contagem fisica: {formatDateTime(product.lastPhysicalCountAt)}
              </div>

              <div>{product.observations || "Sem observacao fixa cadastrada."}</div>

              <div className="stack">
                {product.notes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      background: "var(--surface-muted)",
                      border: "1px solid var(--line)"
                    }}
                  >
                    {note.content}
                  </div>
                ))}
              </div>

              <div className="product-actions-grid">
                <Button variant="danger" onClick={() => setQuickActionTarget(product)}>
                  -1 unidade
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    openMovement(product, "EXIT", {
                      quantity: "1",
                      note: "Saida com observacao"
                    })
                  }
                >
                  Saida
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    openMovement(product, "LOSS", {
                      quantity: "1",
                      note: "Perda por vencimento"
                    })
                  }
                >
                  Perda/descarte
                </Button>
                <Button variant="secondary" onClick={() => openMovement(product, "ENTRY")}>
                  Entrada
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    openMovement(product, "ADJUSTMENT", {
                      countedQuantity: String(product.currentQuantity),
                      note: "Conferencia de estoque"
                    })
                  }
                >
                  Conferencia
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNoteTarget({ id: product.id, name: product.name });
                    setNoteContent("");
                    setNoteModalOpen(true);
                  }}
                >
                  Observacao
                </Button>
              </div>

              {canEditProducts ? (
                <Button variant="ghost" onClick={() => openEditProduct(product)}>
                  Editar cadastro
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {error ? <Card>{error}</Card> : null}

      <Modal
        open={productModalOpen}
        title={productForm.id ? "Editar produto" : "Novo produto"}
        onClose={() => setProductModalOpen(false)}
      >
        <form className="stack" onSubmit={submitProduct}>
          <Input
            placeholder="Nome do produto"
            value={productForm.name}
            onChange={(event) =>
              setProductForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <div className="section-grid">
            <Select
              value={productForm.categoryId}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, categoryId: event.target.value }))
              }
            >
              <option value="">Selecione a categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Unidade"
              value={productForm.unit}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, unit: event.target.value }))
              }
            />
          </div>
          <div className="section-grid">
            <Input
              type="number"
              step="0.001"
              placeholder="Quantidade atual"
              value={productForm.currentQuantity}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, currentQuantity: event.target.value }))
              }
            />
            <Input
              type="number"
              step="0.001"
              placeholder="Estoque minimo"
              value={productForm.minimumStock}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, minimumStock: event.target.value }))
              }
            />
          </div>
          <div className="section-grid">
            <Input
              placeholder="Fornecedor"
              value={productForm.supplier}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, supplier: event.target.value }))
              }
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Custo estimado"
              value={productForm.estimatedCost}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, estimatedCost: event.target.value }))
              }
            />
          </div>
          <Select
            value={productForm.restockPriority}
            onChange={(event) =>
              setProductForm((current) => ({ ...current, restockPriority: event.target.value }))
            }
          >
            <option value="1">Prioridade baixa</option>
            <option value="2">Prioridade media</option>
            <option value="3">Prioridade alta</option>
          </Select>
          <Input
            placeholder="Observacoes fixas"
            value={productForm.observations}
            onChange={(event) =>
              setProductForm((current) => ({ ...current, observations: event.target.value }))
            }
          />
          <Button type="submit" fullWidth>
            Salvar produto
          </Button>
        </form>
      </Modal>

      <Modal
        open={movementModalOpen}
        title="Registrar movimentacao"
        onClose={() => setMovementModalOpen(false)}
      >
        <form className="stack" onSubmit={submitMovement}>
          <Select
            value={movementForm.type}
            onChange={(event) =>
              setMovementForm((current) => ({
                ...current,
                type: event.target.value as MovementFormState["type"]
              }))
            }
          >
            <option value="ENTRY">Entrada</option>
            <option value="EXIT">Saida</option>
            <option value="LOSS">Perda</option>
            <option value="ADJUSTMENT">Ajuste</option>
          </Select>

          {movementForm.type === "ADJUSTMENT" ? (
            <>
              <Input
                type="number"
                step="0.001"
                placeholder="Quantidade contada fisicamente"
                value={movementForm.countedQuantity}
                onChange={(event) =>
                  setMovementForm((current) => ({
                    ...current,
                    countedQuantity: event.target.value
                  }))
                }
              />
              <Input
                type="number"
                step="0.001"
                placeholder="Ou diga quanto quer somar ou tirar"
                value={movementForm.quantity}
                onChange={(event) =>
                  setMovementForm((current) => ({
                    ...current,
                    quantity: event.target.value
                  }))
                }
              />
            </>
          ) : (
            <Input
              type="number"
              step="0.001"
              placeholder="Quantidade"
              value={movementForm.quantity}
              onChange={(event) =>
                setMovementForm((current) => ({ ...current, quantity: event.target.value }))
              }
            />
          )}

          <Input
            placeholder="Observacao da movimentacao"
            value={movementForm.note}
            onChange={(event) =>
              setMovementForm((current) => ({ ...current, note: event.target.value }))
            }
          />
          <Button type="submit" fullWidth>
            Confirmar movimentacao
          </Button>
        </form>
      </Modal>

      <Modal
        open={noteModalOpen}
        title="Adicionar observacao fixa"
        onClose={() => setNoteModalOpen(false)}
      >
        <form className="stack" onSubmit={submitNote}>
          <div className="muted">{noteTarget?.name}</div>
          <Input
            placeholder="Ex.: lote proximo do vencimento"
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
          />
          <Button type="submit" fullWidth>
            Salvar observacao
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!quickActionTarget}
        title="Confirmar baixa rapida"
        description={
          quickActionTarget
            ? `Registrar a saida de 1 unidade de ${quickActionTarget.name}?`
            : ""
        }
        details={
          quickActionTarget
            ? `Saldo atual: ${formatNumber(quickActionTarget.currentQuantity)} ${quickActionTarget.unit}`
            : ""
        }
        confirmLabel="Confirmar saida"
        cancelLabel="Cancelar"
        tone="danger"
        onClose={() => setQuickActionTarget(null)}
        onConfirm={() => void quickDecrease()}
      />
    </div>
  );
}
