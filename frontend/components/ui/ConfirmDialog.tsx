"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel = "Confirmar",
  cancelLabel = "Voltar",
  tone = "danger",
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  description: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="stack">
        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: "1px solid var(--line)",
            background:
              tone === "danger" ? "var(--danger-soft)" : "rgba(31, 122, 82, 0.12)"
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{description}</div>
          {details ? <div className="muted">{details}</div> : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

