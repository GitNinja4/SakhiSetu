export type LanguageCode = 'en' | 'hi' | 'bho' | 'mai' | 'bn';

export type TransactionType = 'sale' | 'expense' | 'purchase' | 'udhaar_repayment';

export interface BusinessProfile {
  ownerName: string;
  shopName: string;
  category: string;
  phone: string;
  upiId: string;
  gstin: string;
  udyamNo: string;
  language: LanguageCode;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpend: number;
  visits: number;
  creditLimit: number;
  udhaarBalance: number;
  lastActivity: string;
}

export interface Transaction {
  id: string;
  clientTxnUuid?: string;
  date: string;
  type: TransactionType;
  productId?: string | null;
  itemName: string;
  qty: number;
  unitPrice: number;
  amount: number;
  costBasis: number;
  gstAmount: number;
  paymentMode: string;
  upiVerified: boolean;
  customerId?: string | null;
  customerName: string;
  synced: boolean;
  createdAt: number;
}

export interface TransactionInput {
  type: TransactionType;
  date?: string;
  productId?: string | null;
  itemName?: string;
  qty?: number;
  unitPrice?: number;
  amount: number;
  costBasis?: number;
  paymentMode?: string;
  upiVerified?: boolean;
  customerId?: string | null;
  customerName?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  detail: string;
  hash: string;
}

export interface BusinessState {
  profile: BusinessProfile;
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
}
