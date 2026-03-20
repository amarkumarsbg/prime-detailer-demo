import type { Part, ProductPurchase, StockMovement } from "@/types";

const L = (litres: number) => litres * 1000;

export const parts: Part[] = [
  { id: "prt-001", name: "Engine Oil 5W-30 (1L)", sku: "OIL-5W30-1L", category: "Lubricants", quantity: 0, primaryUnit: "Litre", secondaryUnit: "ML", conversionFactor: 1000, unitPrice: 450, reorderLevel: 0, supplier: "Castrol India", stockQuantityMl: L(48), reorderLevelMl: L(20), lastRestocked: "2026-03-10T10:00:00Z" },
  { id: "prt-002", name: "Engine Oil 10W-40 (1L)", sku: "OIL-10W40-1L", category: "Lubricants", quantity: 0, primaryUnit: "Litre", secondaryUnit: "ML", conversionFactor: 1000, unitPrice: 380, reorderLevel: 0, supplier: "Shell India", stockQuantityMl: L(32), reorderLevelMl: L(15), lastRestocked: "2026-03-08T10:00:00Z" },
  { id: "prt-003", name: "Oil Filter - Universal", sku: "FLT-OIL-UNI", category: "Filters", quantity: 25, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 220, reorderLevel: 10, supplier: "Bosch India", lastRestocked: "2026-03-05T10:00:00Z" },
  { id: "prt-004", name: "Air Filter - Maruti", sku: "FLT-AIR-MAR", category: "Filters", quantity: 12, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 350, reorderLevel: 8, supplier: "Purolator", lastRestocked: "2026-03-01T10:00:00Z" },
  { id: "prt-005", name: "Air Filter - Hyundai", sku: "FLT-AIR-HYU", category: "Filters", quantity: 8, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 380, reorderLevel: 8, supplier: "Purolator", lastRestocked: "2026-02-28T10:00:00Z" },
  { id: "prt-006", name: "Brake Pad Set - Front", sku: "BRK-PAD-FRT", category: "Brakes", quantity: 14, primaryUnit: "Set", secondaryUnit: "Piece", conversionFactor: 2, unitPrice: 1800, reorderLevel: 6, supplier: "Brembo India", lastRestocked: "2026-03-07T10:00:00Z" },
  { id: "prt-007", name: "Brake Pad Set - Rear", sku: "BRK-PAD-RR", category: "Brakes", quantity: 10, primaryUnit: "Set", secondaryUnit: "Piece", conversionFactor: 2, unitPrice: 1600, reorderLevel: 6, supplier: "Brembo India", lastRestocked: "2026-03-07T10:00:00Z" },
  { id: "prt-008", name: "Brake Disc - Front", sku: "BRK-DSC-FRT", category: "Brakes", quantity: 4, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 3200, reorderLevel: 4, supplier: "Brembo India", lastRestocked: "2026-02-20T10:00:00Z" },
  { id: "prt-009", name: "Spark Plug - Iridium", sku: "ENG-SPK-IRD", category: "Engine", quantity: 30, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 650, reorderLevel: 12, supplier: "NGK India", lastRestocked: "2026-03-09T10:00:00Z" },
  { id: "prt-010", name: "Spark Plug - Standard", sku: "ENG-SPK-STD", category: "Engine", quantity: 40, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 280, reorderLevel: 15, supplier: "NGK India", lastRestocked: "2026-03-09T10:00:00Z" },
  { id: "prt-011", name: "Car Battery 12V 65Ah", sku: "ELC-BAT-65", category: "Electrical", quantity: 6, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 4500, reorderLevel: 4, supplier: "Amara Raja", lastRestocked: "2026-03-02T10:00:00Z" },
  { id: "prt-012", name: "Alternator Belt", sku: "ENG-ALT-BLT", category: "Engine", quantity: 8, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 750, reorderLevel: 5, supplier: "Gates India", lastRestocked: "2026-02-25T10:00:00Z" },
  { id: "prt-013", name: "AC Compressor Oil", sku: "AC-CMP-OIL", category: "AC", quantity: 0, primaryUnit: "Litre", secondaryUnit: "ML", conversionFactor: 1000, unitPrice: 900, reorderLevel: 0, supplier: "Denso India", stockQuantityMl: L(15), reorderLevelMl: L(8), lastRestocked: "2026-03-06T10:00:00Z" },
  { id: "prt-014", name: "R134a Refrigerant (500g)", sku: "AC-R134A-500", category: "AC", quantity: 20, primaryUnit: "Kg", secondaryUnit: "Grams", conversionFactor: 1000, unitPrice: 650, reorderLevel: 10, supplier: "Honeywell India", lastRestocked: "2026-03-04T10:00:00Z" },
  { id: "prt-015", name: "Cabin Air Filter", sku: "FLT-CAB-UNI", category: "Filters", quantity: 18, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 450, reorderLevel: 8, supplier: "Mann Filter", lastRestocked: "2026-03-03T10:00:00Z" },
  { id: "prt-016", name: "Coolant 1L - Green", sku: "LUB-COOL-1L", category: "Lubricants", quantity: 0, primaryUnit: "Litre", secondaryUnit: "ML", conversionFactor: 1000, unitPrice: 280, reorderLevel: 0, supplier: "Prestone India", stockQuantityMl: L(22), reorderLevelMl: L(10), lastRestocked: "2026-03-11T10:00:00Z" },
  { id: "prt-017", name: "Shock Absorber - Front", sku: "SUS-SHK-FRT", category: "Suspension", quantity: 3, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 3800, reorderLevel: 4, supplier: "Monroe India", lastRestocked: "2026-02-15T10:00:00Z" },
  { id: "prt-018", name: "Wiper Blade 22\"", sku: "BDY-WPR-22", category: "Body", quantity: 16, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 350, reorderLevel: 8, supplier: "Bosch India", lastRestocked: "2026-03-10T10:00:00Z" },
  { id: "prt-019", name: "Headlight Bulb H4", sku: "ELC-HLB-H4", category: "Electrical", quantity: 20, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 280, reorderLevel: 10, supplier: "Osram India", lastRestocked: "2026-03-08T10:00:00Z" },
  { id: "prt-020", name: "Fuel Filter - Universal", sku: "FLT-FUEL-UNI", category: "Filters", quantity: 7, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 480, reorderLevel: 6, supplier: "Bosch India", lastRestocked: "2026-02-22T10:00:00Z" },
  { id: "prt-021", name: "Car Shampoo (5L)", sku: "DTL-SHMP-5L", category: "Detailing", quantity: 0, primaryUnit: "Litre", secondaryUnit: "ML", conversionFactor: 1000, unitPrice: 850, reorderLevel: 0, supplier: "3M India", stockQuantityMl: L(12), reorderLevelMl: L(4), lastRestocked: "2026-03-10T10:00:00Z" },
  { id: "prt-022", name: "Car Polish Wax (1L)", sku: "DTL-WAX-1L", category: "Detailing", quantity: 0, primaryUnit: "Litre", secondaryUnit: "ML", conversionFactor: 1000, unitPrice: 1200, reorderLevel: 0, supplier: "Meguiars India", stockQuantityMl: L(8), reorderLevelMl: L(4), lastRestocked: "2026-03-08T10:00:00Z" },
  { id: "prt-023", name: "Interior Cleaner (2L)", sku: "DTL-INT-2L", category: "Detailing", quantity: 0, primaryUnit: "Litre", secondaryUnit: "ML", conversionFactor: 1000, unitPrice: 650, reorderLevel: 0, supplier: "Armor All India", stockQuantityMl: L(10), reorderLevelMl: L(4), lastRestocked: "2026-03-05T10:00:00Z" },
  { id: "prt-024", name: "Microfiber Cloth", sku: "DTL-MFB-CLTH", category: "Detailing", quantity: 50, primaryUnit: "Piece", secondaryUnit: "Piece", conversionFactor: 1, unitPrice: 120, reorderLevel: 20, supplier: "Chemical Guys India", lastRestocked: "2026-03-12T10:00:00Z" },
  { id: "prt-025", name: "PPF Film (sq.ft roll)", sku: "DTL-PPF-ROLL", category: "Detailing", quantity: 6, primaryUnit: "Roll", secondaryUnit: "Sq.ft", conversionFactor: 50, unitPrice: 4500, reorderLevel: 2, supplier: "XPEL India", lastRestocked: "2026-02-28T10:00:00Z" },
];

export const productPurchases: ProductPurchase[] = [
  { id: "pp-001", partId: "prt-001", vendorName: "Castrol India", quantityMl: L(24), unitCost: 380, reference: "PO-2026-0142", purchasedAt: "2026-03-10T10:00:00Z", recordedBy: "usr-003" },
  { id: "pp-002", partId: "prt-016", vendorName: "Prestone India", quantityMl: L(12), unitCost: 220, reference: "PO-2026-0138", purchasedAt: "2026-03-11T10:00:00Z", recordedBy: "usr-003" },
  { id: "pp-003", partId: "prt-021", vendorName: "3M India", quantityMl: L(25), unitCost: 780, reference: "PO-2026-0155", purchasedAt: "2026-03-09T14:00:00Z", recordedBy: "usr-003" },
];

export const stockMovements: StockMovement[] = [
  { id: "sm-001", partId: "prt-001", type: "IN", quantity: 24000, unit: "ML", reason: "Regular restock", vendor: "Castrol India", purchaseId: "pp-001", performedBy: "usr-003", createdAt: "2026-03-10T10:00:00Z" },
  { id: "sm-002", partId: "prt-006", type: "OUT", quantity: 2, unit: "Set", reason: "Used in JC-2026-0009", jobCardId: "jc-009", performedBy: "usr-007", createdAt: "2026-03-11T10:30:00Z" },
  { id: "sm-003", partId: "prt-009", type: "OUT", quantity: 4, unit: "Piece", reason: "Used in JC-2026-0004", jobCardId: "jc-004", performedBy: "usr-006", createdAt: "2026-03-11T14:00:00Z" },
  { id: "sm-004", partId: "prt-014", type: "OUT", quantity: 1, unit: "Kg", reason: "Used in JC-2026-0010", jobCardId: "jc-010", performedBy: "usr-008", createdAt: "2026-03-12T11:30:00Z" },
  { id: "sm-005", partId: "prt-011", type: "OUT", quantity: 1, unit: "Piece", reason: "Used in JC-2026-0005", jobCardId: "jc-005", performedBy: "usr-006", createdAt: "2026-03-12T09:00:00Z" },
  { id: "sm-006", partId: "prt-016", type: "IN", quantity: 12000, unit: "ML", reason: "Regular restock", vendor: "Prestone India", purchaseId: "pp-002", performedBy: "usr-003", createdAt: "2026-03-11T10:00:00Z" },
  { id: "sm-007", partId: "prt-003", type: "OUT", quantity: 1, unit: "Piece", reason: "Used in JC-2026-0008", jobCardId: "jc-008", performedBy: "usr-006", createdAt: "2026-03-12T11:00:00Z" },
  { id: "sm-008", partId: "prt-018", type: "IN", quantity: 8, unit: "Piece", reason: "Regular restock", performedBy: "usr-003", createdAt: "2026-03-10T10:00:00Z" },
];
