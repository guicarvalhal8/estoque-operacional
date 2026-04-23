export type Role = "ADMIN" | "MANAGER" | "OPERATOR";
export type ProductStatus = "NORMAL" | "LOW" | "CRITICAL" | "ZEROED";
export type MovementType = "ENTRY" | "EXIT" | "LOSS" | "ADJUSTMENT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export type Product = {
  id: string;
  name: string;
  unit: string;
  currentQuantity: number;
  minimumStock: number;
  observations: string;
  status: ProductStatus;
  supplier: string;
  estimatedCost: number | null;
  restockPriority: number;
  lastPhysicalCountAt: string | null;
  updatedAt: string;
  category: { id: string; name: string };
  alert?: { id: string; level: string; message: string; isActive: boolean } | null;
  notes: Array<{ id: string; content: string; pinned: boolean; createdAt: string }>;
};

export type Movement = {
  id: string;
  type: MovementType;
  quantity: number;
  delta: number;
  quantityBefore: number;
  quantityAfter: number;
  note: string;
  occurredAt: string;
  product: { id: string; name: string; unit: string };
  user: { id: string; name: string; role: Role };
};

export type DashboardOverview = {
  summary: {
    totalProducts: number;
    totalStockUnits: number;
    lowStockCount: number;
    zeroStockCount: number;
  };
  lowStockProducts: Product[];
  zeroStockProducts: Product[];
  recentMovements: Movement[];
  catalog: Product[];
};

export type ReportData = {
  summary: {
    totalProducts: number;
    totalStockUnits: number;
    lowStockCount: number;
    criticalCount: number;
    movementsToday: number;
  };
  currentStock: Array<{
    product: string;
    category: string;
    quantity: number;
    unit: string;
    minimumStock: number;
    status: ProductStatus;
    supplier: string;
    estimatedCost: number | null;
  }>;
  dailyMovements: Array<{
    product: string;
    type: MovementType;
    quantity: number;
    delta: number;
    user: string;
    note: string;
    occurredAt: string;
  }>;
  topExits: Array<{ product: string; total: number }>;
  topLosses: Array<{ product: string; total: number }>;
  replenishmentNeed: Array<{
    product: string;
    category: string;
    currentQuantity: number;
    minimumStock: number;
    suggested: number;
    priority: number;
  }>;
};

export type ReplenishmentSuggestion = {
  productId: string;
  productName: string;
  categoryName: string;
  currentQuantity: number;
  minimumStock: number;
  suggestedQuantity: number;
  unit: string;
  priority: number;
  supplier: string;
  status: ProductStatus;
};

export type PurchaseOrder = {
  id: string;
  title: string;
  status: "PENDING" | "ORDERED";
  notes: string;
  createdAt: string;
  orderedAt: string | null;
  createdBy: { id: string; name: string; role: Role };
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    unit: string;
    quantitySuggested: number;
    currentQuantity: number;
    minimumStock: number;
    priority: number;
  }>;
};

export type StockCountItem = {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  unit: string;
  systemQuantity: number;
  countedQuantity: number | null;
  difference: number | null;
  note: string;
  currentQuantity: number;
  minimumStock: number;
};

export type StockCountSession = {
  id: string;
  title: string;
  status: "OPEN" | "CLOSED";
  referenceDate: string;
  notes: string;
  startedAt: string;
  closedAt: string | null;
  createdBy: { id: string; name: string };
  closedBy: { id: string; name: string } | null;
  summary: {
    totalItems: number;
    countedItems: number;
    pendingItems: number;
  };
  items: StockCountItem[];
};

export type StockCountAnalysis = {
  available: boolean;
  message?: string;
  period?: {
    from: string;
    to: string;
    previousTitle: string;
    currentTitle: string;
  };
  summary?: {
    totalCountedProducts: number;
    totalOutflowUnits: number;
    productsWithOutflow: number;
  };
  topOutflows?: Array<{ productId: string; productName: string; total: number }>;
  lowOutflows?: Array<{ productId: string; productName: string; total: number }>;
  countDifferences?: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    previousCount: number;
    currentCount: number;
    variation: number;
  }>;
  replenishmentFocus?: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    currentQuantity: number;
    minimumStock: number;
    status: ProductStatus;
  }>;
};
