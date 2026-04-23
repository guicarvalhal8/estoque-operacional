export function getProductStatus(
  currentQuantity: number,
  minimumStock: number
): "NORMAL" | "LOW" | "CRITICAL" | "ZEROED" {
  if (currentQuantity <= 0) return "ZEROED";
  if (currentQuantity <= minimumStock * 0.5) return "CRITICAL";
  if (currentQuantity <= minimumStock) return "LOW";
  return "NORMAL";
}

export function getAlertPayload(currentQuantity: number, minimumStock: number): {
  level: "LOW" | "CRITICAL";
  message: string;
} | null {
  if (currentQuantity <= 0) {
    return {
      level: "CRITICAL",
      message: "Produto sem estoque"
    };
  }

  if (currentQuantity <= minimumStock * 0.5) {
    return {
      level: "CRITICAL",
      message: "Produto em nivel critico"
    };
  }

  if (currentQuantity <= minimumStock) {
    return {
      level: "LOW",
      message: "Produto abaixo do estoque minimo"
    };
  }

  return null;
}
