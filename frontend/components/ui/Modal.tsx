"use client";

export function Modal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 12, 10, 0.45)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 1000
      }}
    >
      <div
        className="panel"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(620px, 100%)",
          padding: 24
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 18
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              fontSize: "1.25rem"
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-soft)",
              cursor: "pointer",
              fontSize: 22
            }}
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

