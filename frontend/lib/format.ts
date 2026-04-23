export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits
  }).format(value);
}

export function formatCurrency(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function statusLabel(status: string) {
  switch (status) {
    case "LOW":
      return "Baixo";
    case "CRITICAL":
      return "Critico";
    case "ZEROED":
      return "Zerado";
    default:
      return "Normal";
  }
}

export function movementLabel(type: string) {
  switch (type) {
    case "ENTRY":
      return "Entrada";
    case "EXIT":
      return "Saida";
    case "LOSS":
      return "Perda";
    case "ADJUSTMENT":
      return "Ajuste";
    default:
      return type;
  }
}

