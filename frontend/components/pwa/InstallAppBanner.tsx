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
        <div style={{ fontWeight: 700 }}>Use como aplicativo no celular</div>
        <div className="muted" style={{ marginTop: 4 }}>
          Instale o sistema para abrir pelo icone da tela inicial, sem precisar entrar no navegador toda vez.
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
