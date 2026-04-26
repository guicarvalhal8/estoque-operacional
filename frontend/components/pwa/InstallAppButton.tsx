"use client";

import { useState } from "react";
import { usePwa } from "../../lib/pwa-context";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function InstallAppButton({
  variant = "secondary",
  fullWidth = false,
  label = "Instalar app"
}: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
  label?: string;
}) {
  const { canInstall, installApp, isAppleMobile, isInstalled } = usePwa();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const handleClick = async () => {
    if (isInstalled) return;

    if (canInstall) {
      await installApp();
      return;
    }

    setInstructionsOpen(true);
  };

  return (
    <>
      <Button variant={variant} fullWidth={fullWidth} onClick={() => void handleClick()} disabled={isInstalled}>
        {isInstalled ? "App instalado" : label}
      </Button>

      <Modal open={instructionsOpen} title="Como instalar o app" onClose={() => setInstructionsOpen(false)}>
        <div className="stack">
          <p className="muted" style={{ margin: 0 }}>
            Se o navegador nao mostrar a instalacao automaticamente, voce ainda pode instalar por ele.
          </p>
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              border: "1px solid var(--line)",
              background: "var(--surface-muted)"
            }}
          >
            <strong>No computador</strong>
            <div className="muted" style={{ marginTop: 6 }}>
              Abra o menu do navegador e procure por "Instalar aplicativo", "Instalar app" ou algo parecido.
            </div>
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              border: "1px solid var(--line)",
              background: "var(--surface-muted)"
            }}
          >
            <strong>No celular</strong>
            <div className="muted" style={{ marginTop: 6 }}>
              {isAppleMobile
                ? 'No Safari, toque em "Compartilhar" e depois em "Adicionar a Tela de Inicio".'
                : 'No Chrome, toque no menu do navegador e escolha "Instalar app" ou "Adicionar a tela inicial".'}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
