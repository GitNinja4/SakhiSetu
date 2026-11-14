import { sha256Short } from './metrics';
import type { BusinessState, Transaction, TransactionInput } from './models';

export function createTransaction(payload: TransactionInput): Transaction {
  const qty = Math.max(1, Number(payload.qty || 1));
  const amount = Number(payload.amount || 0);
  const clientTxnUuid = globalThis.crypto?.randomUUID?.();
  if (!clientTxnUuid) {
    throw new Error('A secure browser UUID generator is required to record transactions.');
  }

  return {
    id: clientTxnUuid,
    clientTxnUuid,
    date: payload.date || new Date().toISOString().split('T')[0],
    type: payload.type,
    productId: payload.productId || null,
    itemName: payload.itemName || 'Store Entry',
    qty,
    unitPrice: Number(payload.unitPrice || Math.round(amount / qty)),
    amount,
    costBasis: Number(payload.costBasis || 0),
    gstAmount: payload.type === 'sale' ? Math.round(amount * 0.05) : 0,
    paymentMode: payload.paymentMode || 'UPI',
    upiVerified:
      payload.paymentMode === 'UPI' ? Boolean(payload.upiVerified ?? false) : true,
    customerId: payload.customerId || null,
    customerName: payload.customerName || 'Walk-in Customer',
    synced: false,
    createdAt: Date.now(),
  };
}

export function applyTransaction(state: BusinessState, record: Transaction): BusinessState {
  const nextProducts = state.products.map((product) => {
    if (product.id !== record.productId || product.unit === 'service') return product;
    if (record.type === 'sale') return { ...product, stock: product.stock - record.qty };
    if (record.type === 'purchase') {
      return {
        ...product,
        stock: product.stock + record.qty,
        costPrice: record.unitPrice > 0 ? record.unitPrice : product.costPrice,
      };
    }
    return product;
  });

  const nextCustomers = [...state.customers];
  if (record.customerName && !['Walk-in Customer', 'Shop Expense'].includes(record.customerName)) {
    const customerIndex = nextCustomers.findIndex(
      (customer) =>
        customer.id === record.customerId ||
        customer.name.toLowerCase() === record.customerName.toLowerCase(),
    );

    if (customerIndex >= 0) {
      const customer = nextCustomers[customerIndex];
      let udhaarBalance = customer.udhaarBalance;
      let totalSpend = customer.totalSpend;
      let visits = customer.visits;

      if (record.type === 'sale') {
        totalSpend += record.amount;
        visits += 1;
        if (record.paymentMode === 'Udhaar') udhaarBalance += record.amount;
      } else if (record.type === 'udhaar_repayment') {
        udhaarBalance = Math.max(0, udhaarBalance - record.amount);
      }

      nextCustomers[customerIndex] = {
        ...customer,
        udhaarBalance,
        totalSpend,
        visits,
        lastActivity: record.date,
      };
    } else if (record.type === 'sale') {
      nextCustomers.push({
        id: `C-${String(nextCustomers.length + 1).padStart(2, '0')}`,
        name: record.customerName,
        phone: '9835000000',
        totalSpend: record.amount,
        visits: 1,
        creditLimit: 2500,
        udhaarBalance: record.paymentMode === 'Udhaar' ? record.amount : 0,
        lastActivity: record.date,
      });
    }
  }

  const previousHash = state.auditLogs[0]?.hash || '0000000000000000';
  const auditEntry = {
    id: `AUD-${String(state.auditLogs.length + 1).padStart(2, '0')}`,
    timestamp: new Date().toISOString(),
    event: `TXN_${record.type.toUpperCase()}`,
    detail: `${record.id}: ${record.itemName} ₹${record.amount} (${record.paymentMode})`,
    hash: sha256Short(`${previousHash}|${record.id}|${record.amount}|${Date.now()}`),
  };

  return {
    ...state,
    products: nextProducts,
    customers: nextCustomers,
    transactions: [record, ...state.transactions],
    auditLogs: [auditEntry, ...state.auditLogs.slice(0, 39)],
  };
}
