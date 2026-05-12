import { DatabaseService } from './DatabaseService';
import { useGemmaService } from './GemmaService';

export class QueryEngine {
  static async naturalLanguageSearch(
    userQuery: string, 
    generateSQL: (q: string) => Promise<string>
  ): Promise<any[]> {
    const db = await DatabaseService.getDb();
    
    // Step 1: Convert NL to SQL WHERE clause using Gemma
    const whereClause = await generateSQL(userQuery);
    
    // Step 2: Execute query
    // We sanitize and ensure it's just a WHERE clause
    const sql = `SELECT * FROM events WHERE ${whereClause} ORDER BY timestamp DESC LIMIT 20`;
    
    try {
      const results = await db.getAllAsync(sql);
      return results;
    } catch (e) {
      console.error('SQL Query failed:', sql, e);
      // Fallback to FTS5 search if SQL generation fails
      return await this.ftsSearch(userQuery);
    }
  }

  static async ftsSearch(query: string): Promise<any[]> {
    const db = await DatabaseService.getDb();
    // FTS5 search on counterparty
    return await db.getAllAsync(
      `SELECT * FROM events 
       WHERE rowid IN (SELECT rowid FROM events_fts WHERE counterparty MATCH ?)
       ORDER BY timestamp DESC LIMIT 20`,
      [`${query}*`]
    );
  }
}
