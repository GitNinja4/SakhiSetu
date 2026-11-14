import Dexie, { type Table } from 'dexie';
import type { BusinessState, Transaction } from '../domain/models';

export interface QueuedTransaction extends Transaction {
  clientTxnUuid: string;
  shopId: string;
}

class BusinessOfflineDatabase extends Dexie {
  businessState!: Table<{ key: string; state: BusinessState }, string>;
  pendingTransactions!: Table<QueuedTransaction, string>;

  constructor() {
    super('sakhisetu_offline');
    this.version(2).stores({
      businessState: 'key',
      pendingTransactions: 'clientTxnUuid, shopId, createdAt',
    });
  }
}

export const businessOfflineDatabase = new BusinessOfflineDatabase();
