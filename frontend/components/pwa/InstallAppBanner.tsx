"use client";

import { useState } from "react";
import { usePwa } from "../../lib/pwa-context";
import { InstallAppButton } from "./InstallAppButton";

export function InstallAppBanner() {
  const { isInstalled, isMobileDevice } = usePwa();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !isMobileDevice || dismissed) return null;

  return (
    <div
      className="panel"
      style={{
        padding: 16,
        display: "grid",
        gap: 12
      }}
    >
      <div>
        <div style={{ fontWeight: 700 }}>Instale no celular</div>
        <div className="muted" style={{ marginTop: 4 }}>
          Abra pelo icone da tela inicial, como um app normal.
        </div>
      </div>
      <div className="mobile-card-grid">
        <div
          style={{
            padding: 12,
            borderRadius: 16,
            background: "var(--surface-muted)",
            border: "1px solid var(--line)"
          }}
        >
          <strong>1. Toque em instalar</strong>
          <div className="muted" style={{ marginTop: 4 }}>
            Se o navegador permitir, o app instala na hora.
          </div>
        </div>
        <div
          style={{
            padding: 12,
            borderRadius: 16,
            background: "var(--surface-muted)",
            border: "1px solid var(--line)"
          }}
        >
          <strong>2. Abra pelo icone</strong>
          <div className="muted" style={{ marginTop: 4 }}>
            Depois disso, nao precisa entrar no Safari ou Chrome toda vez.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <InstallAppButton label="Instalar no celular" />
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--text-soft)",
            borderRadius: 14,
            padding: "12px 16px",
            fontWeight: 700
          }}
        >
          Agora nao
        </button>
      </div>
    </div>
  );
}
