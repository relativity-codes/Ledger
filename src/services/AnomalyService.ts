import { DatabaseService } from './DatabaseService';
import { LedgerEntry } from './LedgerEngine';

export interface Anomaly {
  entry: LedgerEntry;
  expectedMax: number;
  reason: string;
}

export class AnomalyService {
  static async checkAnomaly(entry: LedgerEntry): Promise<Anomaly | null> {
    const db = await DatabaseService.getDb();
    
    // Get last 7 days of expenses in this category
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const result = await db.getAllAsync<any>(
      `SELECT AVG(amount) as avg_amount, COUNT(*) as count
       FROM events
       WHERE type = 'expense' 
         AND category = ? 
         AND timestamp > ?
         AND timestamp < ?`,
      [entry.category, weekAgo, entry.timestamp]
    );
    
    const avgAmount = result[0]?.avg_amount || 0;
    const count = result[0]?.count || 0;
    
    if (count < 3) return null; // Not enough data for baseline

    const threshold = avgAmount * 1.5; // 50% above average
    
    if (entry.amount > threshold && entry.amount > 1000) { // Min threshold 1000 (cents/base unit)
      return {
        entry,
        expectedMax: threshold,
        reason: `50% above your typical ${entry.category} spend (avg: ${avgAmount.toFixed(0)})`
      };
    }
    
    return null;
  }
}
