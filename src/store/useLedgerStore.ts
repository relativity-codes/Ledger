import { create } from 'zustand';
import { LedgerEngine, LedgerEntry } from '../services/LedgerEngine';

interface LedgerState {
  balance: number;
  recentTransactions: LedgerEntry[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set) => ({
  balance: 0,
  recentTransactions: [],
  isLoading: false,
  refresh: async () => {
    set({ isLoading: true });
    try {
      const [balance, history] = await Promise.all([
        LedgerEngine.getBalance(),
        LedgerEngine.getHistory(20),
      ]);
      set({ balance, recentTransactions: history });
    } catch (error) {
      console.error('Failed to refresh ledger:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
