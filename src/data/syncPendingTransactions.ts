import { businessOfflineDatabase } from './BusinessOfflineDatabase';
import type { Transaction } from '../domain/models';

export interface SyncedTransaction {
  clientTxnUuid: string;
  id: string;
  amount: number;
  costBasis: number;
  gstAmount: number;
}

const activeSyncs = new Map<string, Promise<SyncedTransaction[]>>();

export async function queuePendingTransactions(shopId: string, transactions: Transaction[]) {
  const pending = transactions.filter(
    (transaction): transaction is Transaction & { clientTxnUuid: string } =>
      !transaction.synced && Boolean(transaction.clientTxnUuid),
  );
  await businessOfflineDatabase.pendingTransactions.bulkPut(
    pending.map((transaction) => ({
      ...transaction,
      clientTxnUuid: transaction.clientTxnUuid,
      shopId,
    })),
  );
}

export function syncPendingTransactions(shopId: string): Promise<SyncedTransaction[]> {
  const active = activeSyncs.get(shopId);
  if (active) return active;

  const sync = (async () => {
    const queued = await businessOfflineDatabase.pendingTransactions
      .where('shopId')
      .equals(shopId)
      .sortBy('createdAt');
    const synced: SyncedTransaction[] = [];

    for (const transaction of queued) {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientTxnUuid: transaction.clientTxnUuid,
          type: transaction.type,
          productId: transaction.productId,
          itemName: transaction.itemName,
          qty: transaction.qty,
          unitPrice: transaction.unitPrice,
          amount: transaction.amount,
          costBasis: transaction.costBasis,
          paymentMode: transaction.paymentMode,
          customerId: transaction.customerId,
          customerName: transaction.customerName,
          transactionDate: transaction.date,
        }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.transaction?.id !== 'string') {
        throw new Error(result.error || 'Could not sync an offline transaction.');
      }

      synced.push({
        clientTxnUuid: transaction.clientTxnUuid,
        id: result.transaction.id,
        amount: Number(result.transaction.amount),
        costBasis: Number(result.transaction.cost_basis),
        gstAmount: Number(result.transaction.gst_amount),
      });
      await businessOfflineDatabase.pendingTransactions.delete(transaction.clientTxnUuid);
    }

    return synced;
  })();

  activeSyncs.set(shopId, sync);
  sync.finally(() => activeSyncs.delete(shopId)).catch(() => undefined);
  return sync;
}
