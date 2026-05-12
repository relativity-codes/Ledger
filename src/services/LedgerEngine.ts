import * as Crypto from 'expo-crypto';
import { DatabaseService } from './DatabaseService';
import { StructuredEntry } from './GemmaService';
import { AnomalyService } from './AnomalyService';
import { PiperService } from './PiperService';

export type InputSource = 'voice' | 'image' | 'sms' | 'manual';

export interface LedgerEntry extends StructuredEntry {
  id: string;
  timestamp: number;
  source: InputSource;
  rawInputHash: string;
  isPending: boolean;
}

export class LedgerEngine {
  static async addEntry(
    source: InputSource,
    structured: StructuredEntry,
    rawInput: string
  ): Promise<LedgerEntry> {
    const db = await DatabaseService.getDb();
    const now = Date.now();
    const id = Crypto.randomUUID();
    const rawHash = await this.hashText(rawInput);
    const deviceSeq = await DatabaseService.nextDeviceSeq();

    const entry: LedgerEntry = {
      id,
      timestamp: now,
      ...structured,
      source,
      rawInputHash: rawHash,
      isPending: false,
    };

    await db.runAsync(
      `INSERT INTO events (id, timestamp, amount, type, category, counterparty, source, raw_hash, is_pending, device_seq, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        now,
        entry.amount,
        entry.type,
        entry.category,
        entry.counterparty || null,
        entry.source,
        rawHash,
        0,
        deviceSeq,
        now,
      ]
    );

    // Update balance
    const diff = entry.type === 'income' ? entry.amount : -entry.amount;
    await db.runAsync(
      `UPDATE balances SET balance = balance + ?, last_updated = ? WHERE id = 1`,
      [diff, now]
    );

    // Anomaly Detection (Async)
    this.processAnomaly(entry);

    return entry;
  }

  private static async processAnomaly(entry: LedgerEntry) {
    const anomaly = await AnomalyService.checkAnomaly(entry);
    if (anomaly) {
      console.warn('Anomaly detected:', anomaly.reason);
      await PiperService.speak(`Warning: ${anomaly.reason}`);
    } else {
      await PiperService.speak(`Added ${entry.type} of ${entry.amount / 100}`);
    }
  }

  private static async hashText(text: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
  }

  static async getBalance(): Promise<number> {
    const db = await DatabaseService.getDb();
    const row = await db.getFirstAsync<{ balance: number }>('SELECT balance FROM balances WHERE id = 1');
    return row?.balance ?? 0;
  }

  static async getHistory(limit = 20): Promise<LedgerEntry[]> {
    const db = await DatabaseService.getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM events ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
    return rows.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      amount: r.amount,
      type: r.type,
      category: r.category,
      counterparty: r.counterparty,
      source: r.source,
      rawInputHash: r.raw_hash,
      isPending: r.is_pending === 1,
    }));
  }
}
