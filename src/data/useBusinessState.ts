import { useEffect, useState } from 'react';
import { businessOfflineDatabase } from './BusinessOfflineDatabase';
import { createEmptyBusinessState, INITIAL_STATE } from '../domain/initialState';
import type { BusinessState } from '../domain/models';

export function useBusinessState(storageKey: string | null = 'demo') {
  const [state, setState] = useState<BusinessState>(INITIAL_STATE);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    setHydratedKey(null);
    setState(storageKey === 'demo' ? INITIAL_STATE : createEmptyBusinessState());
    if (!storageKey) return;
    let active = true;
    businessOfflineDatabase.businessState.get(storageKey)
      .then((saved) => {
        if (!active) return;
        if (saved) setState(saved.state);
        setHydratedKey(storageKey);
      })
      .catch((error) => {
        console.error('Failed to load SakhiSetu offline data from IndexedDB.', error);
        if (active) setHydratedKey(storageKey);
      });

    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || hydratedKey !== storageKey) return;
    businessOfflineDatabase.transaction(
      'rw',
      businessOfflineDatabase.businessState,
      businessOfflineDatabase.pendingTransactions,
      async () => {
        await businessOfflineDatabase.businessState.put({ key: storageKey, state });
        for (const transaction of state.transactions) {
          if (transaction.synced && transaction.clientTxnUuid) {
            await businessOfflineDatabase.pendingTransactions.delete(transaction.clientTxnUuid);
          } else if (!transaction.synced && transaction.clientTxnUuid) {
            await businessOfflineDatabase.pendingTransactions.put({
              ...transaction,
              clientTxnUuid: transaction.clientTxnUuid,
              shopId: storageKey,
            });
          }
        }
      },
    ).catch((error) => {
      console.error('Failed to persist SakhiSetu offline data to IndexedDB.', error);
    });
  }, [state, hydratedKey, storageKey]);

  return [state, setState, hydratedKey] as const;
}
