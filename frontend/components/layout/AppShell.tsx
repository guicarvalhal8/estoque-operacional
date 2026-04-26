"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { InstallAppButton } from "../pwa/InstallAppButton";
import { Button } from "../ui/Button";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../lib/theme-context";
import type { Role } from "../../lib/types";

const navigationItems: Array<{ href: string; label: string; roles: Role[] }> = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "MANAGER", "OPERATOR"] },
  { href: "/products", label: "Estoque", roles: ["ADMIN", "MANAGER", "OPERATOR"] },
  { href: "/counts", label: "Contagem", roles: ["ADMIN", "MANAGER"] },
  { href: "/movements", label: "Movimentacoes", roles: ["ADMIN", "MANAGER"] },
  { href: "/reports", label: "Relatorios", roles: ["ADMIN", "MANAGER"] },
  { href: "/replenishment", label: "Reposicao", roles: ["ADMIN", "MANAGER"] }
];

export function AppShell({
  title,
  subtitle,
  actions,
  children
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleNavigationItems = navigationItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div
      className="page-shell"
      style={{
        minHeight: "100vh",
        padding: "var(--shell-pad)"
      }}
    >
      <div className="panel mobile-nav-bar">
        <div>
          <div
            style={{
              color: "var(--primary)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: 11
            }}
          >
            Estoque Operacional
          </div>
          <div style={{ fontWeight: 700 }}>{title}</div>
        </div>
        <button type="button" onClick={() => setMobileMenuOpen((current) => !current)}>
          {mobileMenuOpen ? "Fechar" : "Menu"}
        </button>
      </div>

      <div
        className={`app-sidebar-backdrop${mobileMenuOpen ? " is-open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div className="app-shell-grid">
        <aside
          className={`panel app-sidebar${mobileMenuOpen ? " is-open" : ""}`}
          style={{
            padding: 22,
            display: "grid",
            gap: 18,
            alignSelf: "start",
            position: "sticky",
            top: 22
          }}
        >
          <div className="stack">
            <span
              style={{
                color: "var(--primary)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontSize: 12
              }}
            >
              Estoque Operacional
            </span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.45rem"
                }}
              >
                Controle diario da equipe
              </h1>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                Fluxo rapido para entrada, baixa, perdas e reposicao.
              </p>
            </div>
          </div>

          <nav className="stack">
            {visibleNavigationItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 18,
                    background: active ? "rgba(31, 122, 82, 0.14)" : "transparent",
                    color: active ? "var(--primary-strong)" : "var(--text)",
                    fontWeight: active ? 700 : 500,
                    border: "1px solid transparent"
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="stack">
            <div
              style={{
                padding: 16,
                borderRadius: 18,
                background: "var(--surface-muted)",
                border: "1px solid var(--line)"
              }}
            >
              <div style={{ fontWeight: 700 }}>{user?.name ?? "Sem sessao"}</div>
              <div className="muted">{user?.role ?? "-"}</div>
            </div>
            <InstallAppButton fullWidth />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Button variant="secondary" onClick={toggleTheme}>
                {theme === "light" ? "Modo escuro" : "Modo claro"}
              </Button>
              <Button variant="ghost" onClick={() => void logout()}>
                Sair
              </Button>
            </div>
          </div>
        </aside>

        <main className="page-grid">
          <header
            className="panel"
            style={{
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap"
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.6rem, 4vw, 2rem)"
                }}
              >
                {title}
              </h2>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                {subtitle}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{actions}</div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
