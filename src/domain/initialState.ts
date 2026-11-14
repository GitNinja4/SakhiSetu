import type { BusinessState } from './models';
import { getRelativeDate } from './dates';

export const INITIAL_STATE: BusinessState = {
  profile: {
    ownerName: 'Sunita Devi',
    shopName: 'Sunita Vastra & Craft Store',
    category: 'Handloom, Sarees & Boutique',
    phone: '9876543210',
    upiId: 'sunitacraft@okaxis',
    gstin: '10AABCS4821M1Z2',
    udyamNo: 'UDYAM-BR-26-0094812',
    language: 'en',
  },
  offlineMode: false,
  products: [
    { id: 'P-101', sku: 'SR-01', name: 'Cotton Handloom Saree', category: 'Apparel', sellingPrice: 850, costPrice: 560, stock: 18, minStock: 6, unit: 'pcs' },
    { id: 'P-102', sku: 'KR-02', name: 'Chikankari Kurti Set', category: 'Apparel', sellingPrice: 1150, costPrice: 740, stock: 12, minStock: 5, unit: 'pcs' },
    { id: 'P-103', sku: 'DP-03', name: 'Banarasi Silk Dupatta', category: 'Accessories', sellingPrice: 520, costPrice: 340, stock: 3, minStock: 5, unit: 'pcs' },
    { id: 'P-104', sku: 'BL-04', name: 'Custom Blouse Tailoring', category: 'Tailoring', sellingPrice: 350, costPrice: 110, stock: 99, minStock: 10, unit: 'service' },
    { id: 'P-105', sku: 'BG-05', name: 'Jute Embroidered Tote Bag', category: 'Craft', sellingPrice: 420, costPrice: 260, stock: 9, minStock: 4, unit: 'pcs' },
    { id: 'P-106', sku: 'LC-06', name: 'Zari Lace & Latkan Pack', category: 'Trims', sellingPrice: 85, costPrice: 95, stock: 4, minStock: 5, unit: 'pack' },
  ],
  customers: [
    { id: 'C-01', name: 'Meera Kumari', phone: '9835110011', totalSpend: 5450, visits: 6, creditLimit: 3000, udhaarBalance: 850, lastActivity: getRelativeDate(1) },
    { id: 'C-02', name: 'Ramesh Prasad', phone: '9835110022', totalSpend: 3800, visits: 4, creditLimit: 2500, udhaarBalance: 1200, lastActivity: getRelativeDate(3) },
    { id: 'C-03', name: 'Kavita Jha', phone: '9835110033', totalSpend: 6200, visits: 8, creditLimit: 4000, udhaarBalance: 0, lastActivity: getRelativeDate(0) },
    { id: 'C-04', name: 'Anjali Sinha', phone: '9835110044', totalSpend: 2950, visits: 3, creditLimit: 2000, udhaarBalance: 520, lastActivity: getRelativeDate(5) },
  ],
  transactions: [
    { id: 'TXN-501', date: getRelativeDate(6), type: 'sale', productId: 'P-101', itemName: 'Cotton Handloom Saree', qty: 2, unitPrice: 850, amount: 1700, costBasis: 1120, gstAmount: 85, paymentMode: 'UPI', upiVerified: true, customerId: 'C-03', customerName: 'Kavita Jha', synced: true, createdAt: Date.now() - 6 * 86400000 },
    { id: 'TXN-502', date: getRelativeDate(5), type: 'expense', itemName: 'Shop Electricity & Wi-Fi', qty: 1, unitPrice: 680, amount: 680, costBasis: 0, gstAmount: 0, paymentMode: 'UPI', upiVerified: true, customerName: 'NBPDCL Power', synced: true, createdAt: Date.now() - 5 * 86400000 },
    { id: 'TXN-503', date: getRelativeDate(4), type: 'sale', productId: 'P-102', itemName: 'Chikankari Kurti Set', qty: 2, unitPrice: 1150, amount: 2300, costBasis: 1480, gstAmount: 115, paymentMode: 'Cash', upiVerified: true, customerId: 'C-01', customerName: 'Meera Kumari', synced: true, createdAt: Date.now() - 4 * 86400000 },
    { id: 'TXN-504', date: getRelativeDate(3), type: 'sale', productId: 'P-102', itemName: 'Chikankari Kurti Set', qty: 1, unitPrice: 1200, amount: 1200, costBasis: 740, gstAmount: 60, paymentMode: 'Udhaar', upiVerified: false, customerId: 'C-02', customerName: 'Ramesh Prasad', synced: true, createdAt: Date.now() - 3 * 86400000 },
    { id: 'TXN-505', date: getRelativeDate(2), type: 'purchase', productId: 'P-101', itemName: 'Cotton Handloom Saree', qty: 6, unitPrice: 560, amount: 3360, costBasis: 3360, gstAmount: 168, paymentMode: 'UPI', upiVerified: true, customerName: 'Bhagalpur Weavers Co-op', synced: true, createdAt: Date.now() - 2 * 86400000 },
    { id: 'TXN-506', date: getRelativeDate(2), type: 'expense', itemName: 'Packaging Bags & Tags', qty: 1, unitPrice: 420, amount: 420, costBasis: 0, gstAmount: 0, paymentMode: 'Cash', upiVerified: true, customerName: 'Patna Print House', synced: true, createdAt: Date.now() - 2 * 86400000 },
    { id: 'TXN-507', date: getRelativeDate(1), type: 'sale', productId: 'P-101', itemName: 'Cotton Handloom Saree', qty: 1, unitPrice: 850, amount: 850, costBasis: 560, gstAmount: 42, paymentMode: 'Udhaar', upiVerified: false, customerId: 'C-01', customerName: 'Meera Kumari', synced: true, createdAt: Date.now() - 1 * 86400000 },
    { id: 'TXN-508', date: getRelativeDate(1), type: 'sale', productId: 'P-106', itemName: 'Zari Lace & Latkan Pack', qty: 4, unitPrice: 85, amount: 340, costBasis: 380, gstAmount: 17, paymentMode: 'Cash', upiVerified: true, customerName: 'Walk-in Customer', synced: true, createdAt: Date.now() - 1 * 86400000 },
    { id: 'TXN-509', date: getRelativeDate(0), type: 'sale', productId: 'P-104', itemName: 'Custom Blouse Tailoring', qty: 3, unitPrice: 350, amount: 1050, costBasis: 330, gstAmount: 52, paymentMode: 'UPI', upiVerified: true, customerId: 'C-03', customerName: 'Kavita Jha', synced: true, createdAt: Date.now() - 7200000 },
    { id: 'TXN-510', date: getRelativeDate(0), type: 'sale', productId: 'P-105', itemName: 'Jute Embroidered Tote Bag', qty: 2, unitPrice: 420, amount: 840, costBasis: 520, gstAmount: 42, paymentMode: 'UPI', upiVerified: true, customerId: 'C-04', customerName: 'Anjali Sinha', synced: true, createdAt: Date.now() - 3600000 },
  ],
  auditLogs: [
    { id: 'AUD-01', timestamp: new Date(Date.now() - 86400000).toISOString(), event: 'LEDGER_BOOT', detail: 'Initialized SakhiSetu deterministic double-entry store', hash: '9c4e71b2d80a5f31' },
  ],
};

export function createEmptyBusinessState(profile: Partial<BusinessState['profile']> = {}): BusinessState {
  return {
    profile: {
      ...INITIAL_STATE.profile,
      ...profile,
    },
    offlineMode: false,
    products: [],
    customers: [],
    transactions: [],
    auditLogs: [],
  };
}
