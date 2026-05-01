export type SaleTabStatus = 'ACTIVE' | 'ON_HOLD' | 'READY_TO_PAY' | 'PAID' | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'OTHER';

export type TerminalPaymentStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'WAITING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONNECTION_ERROR'
  | 'CANCELLED';

export type ConnectionStatus = 'CONNECTED' | 'SYNCING' | 'OFFLINE';

export type UserRole = 'CASHIER' | 'SUPERVISOR';

export type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
};

export type Customer = {
  id: string | null;
  rut: string | null;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditEnabled?: boolean;
  creditLimit?: number;
  availableCredit?: number;
};

export type SaleItem = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  source: 'PREVENTA' | 'AUTO';
  iva: number;
  discountPercent: number;
  sellerName?: string;
  preventaId?: string;
  total: number;
};

export type Preventa = {
  id: string;
  vendedor: string;
  items: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    iva: number;
    descuento: number;
  }>;
};

export type PaymentState = {
  method: PaymentMethod | null;
  cashReceived: number;
  transferCode: string;
  transferBank: string;
  terminalStatus: TerminalPaymentStatus;
};

export type SaleTab = {
  id: string;
  displayNumber: string;
  customer: Customer;
  items: SaleItem[];
  subtotal: number;
  discounts: number;
  total: number;
  status: SaleTabStatus;
  payment: PaymentState;
  createdAt: string;
  updatedAt: string;
  pendingSync: boolean;
  completedSaleNumber?: string;
};

export type PosState = {
  cashRegisterOpen: boolean;
  shiftOpen: boolean;
  cashRegisterId: string;
  shiftId: string | null;
  cashierName: string;
  storeName: string;
  terminalName: string;
  shiftOpenedAt?: string | null;
  openingFloat?: number;
  shiftSalesTotal?: number;
  shiftCashTotal?: number;
  lastShiftClose?: ShiftCloseSummary | null;
};

export type ShiftCloseSummary = {
  shiftId: string;
  terminalName: string;
  cashierName: string;
  storeName: string;
  openedAt: string | null;
  closedAt: string;
  openingFloat: number;
  salesTotal: number;
  expectedCash: number;
  declaredCash: number;
  difference: number;
  observation?: string;
  supervisorUser?: string;
};

