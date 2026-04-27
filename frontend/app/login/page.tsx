"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { InstallAppButton } from "../../components/pwa/InstallAppButton";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="login-page">
      <div className="login-hero-grid">
        <Card
          className="login-hero-card"
          style={{
            padding: "clamp(24px, 4vw, 36px)",
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
              className="login-hero-title"
              style={{
                margin: 0,
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.2rem, 7vw, 3rem)",
                lineHeight: 1
              }}
            >
              Estoque claro, historico confiavel e baixa rapida no dia a dia.
            </h1>
            <p className="login-hero-text" style={{ maxWidth: 560, opacity: 0.9 }}>
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

        <Card className="login-form-card" style={{ padding: "clamp(22px, 4vw, 32px)" }}>
          <form className="stack" onSubmit={handleSubmit}>
            <div className="login-mobile-only">
              <span
                style={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontSize: 11
                }}
              >
                Estoque operacional
              </span>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.8rem",
                  lineHeight: 1.05
                }}
              >
                Entre rapido e continue o trabalho
              </h1>
              <p className="muted" style={{ margin: 0 }}>
                Baixa, entrada e consulta de estoque em poucos toques.
              </p>
            </div>

            <div>
              <h2 style={{ margin: 0, fontFamily: "var(--font-heading)" }}>Entrar no sistema</h2>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                Entre com seu email e senha para usar o estoque.
              </p>
            </div>

            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="username"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? "Entrando..." : "Acessar painel"}
            </Button>

            {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}

            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: "var(--surface-muted)",
                border: "1px solid var(--line)"
              }}
            >
              <div style={{ fontWeight: 700 }}>Quer usar como app?</div>
              <div className="muted" style={{ margin: "4px 0 10px" }}>
                Instale no celular e abra pelo icone, como um aplicativo normal.
              </div>
              <InstallAppButton fullWidth />
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
