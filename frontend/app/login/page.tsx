"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { InstallAppButton } from "../../components/pwa/InstallAppButton";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

const demoUsers = [
  { label: "Administrador", email: "admin@estoque.local", password: "Admin@123" },
  { label: "Gerente / Compras", email: "gerente@estoque.local", password: "Gerente@123" },
  { label: "Operadora 1", email: "operadora1@estoque.local", password: "Operadora@123" },
  { label: "Operadora 2", email: "operadora2@estoque.local", password: "Operadora@123" }
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("admin@estoque.local");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await login({ email, password });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha no login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 24
        }}
      >
        <Card
          style={{
            padding: 36,
            background:
              "linear-gradient(145deg, rgba(31, 122, 82, 0.94), rgba(22, 74, 50, 0.95))",
            color: "#fff"
          }}
        >
          <div className="stack">
            <span style={{ opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Operacao de alimentos
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-heading)",
                fontSize: "3rem",
                lineHeight: 1
              }}
            >
              Estoque claro, historico confiavel e baixa rapida no dia a dia.
            </h1>
            <p style={{ maxWidth: 560, opacity: 0.9 }}>
              Aplicacao preparada para equipe interna com alertas, relatorios, reposicao automatica
              e fluxo agil para entrada, saida, perda e ajuste.
            </p>

            <div className="section-grid">
              <div
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: "rgba(255, 255, 255, 0.12)"
                }}
              >
                <strong>Dashboard operacional</strong>
                <div style={{ opacity: 0.88 }}>Visao imediata de risco, saidas e estoque atual.</div>
              </div>
              <div
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: "rgba(255, 255, 255, 0.12)"
                }}
              >
                <strong>Historico imutavel</strong>
                <div style={{ opacity: 0.88 }}>Toda alteracao fica registrada com usuario e observacao.</div>
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 32 }}>
          <form className="stack" onSubmit={handleSubmit}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "var(--font-heading)" }}>Entrar no sistema</h2>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                Autenticacao simples e segura para equipe operacional.
              </p>
            </div>

            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
            />
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? "Entrando..." : "Acessar painel"}
            </Button>

            {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}

            <div className="stack">
              <span className="muted">Perfis de acesso iniciais</span>
              {demoUsers.map((item) => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => {
                    setEmail(item.email);
                    setPassword(item.password);
                  }}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid var(--line)",
                    background: "var(--surface-muted)",
                    cursor: "pointer",
                    color: "var(--text)"
                  }}
                >
                  <strong>{item.label}</strong>
                  <div className="muted">{item.email}</div>
                </button>
              ))}
            </div>

            <div className="stack">
              <span className="muted">Acesso rapido no celular e no computador</span>
              <InstallAppButton fullWidth />
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
