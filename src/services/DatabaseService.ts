import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export const SCHEMA_SQL = `
-- Core events table (append-only ledger)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK(category IN ('food', 'transport', 'supplies', 'utilities', 'other')),
  counterparty TEXT,
  source TEXT NOT NULL CHECK(source IN ('voice', 'image', 'sms', 'manual')),
  raw_hash TEXT NOT NULL,
  is_pending INTEGER DEFAULT 0,
  device_seq INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Materialized balances (for fast queries)
CREATE TABLE IF NOT EXISTS balances (
  id INTEGER PRIMARY KEY CHECK(id=1),
  balance INTEGER NOT NULL,
  last_updated INTEGER NOT NULL
);

-- Credit customers
CREATE TABLE IF NOT EXISTS credit_customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at INTEGER NOT NULL,
  total_owed INTEGER DEFAULT 0,
  total_paid INTEGER DEFAULT 0
);

-- Credit transactions (append-only)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due_date INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES credit_customers(id)
);

-- FTS5 for search 
-- Note: SQLite versions in Expo usually support FTS5
CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
  counterparty,
  content='events',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

-- Triggers for FTS sync
CREATE TRIGGER IF NOT EXISTS events_ai AFTER INSERT ON events BEGIN
  INSERT INTO events_fts(rowid, counterparty)
  VALUES (new.rowid, new.counterparty);
END;

CREATE TRIGGER IF NOT EXISTS events_ad AFTER DELETE ON events BEGIN
  INSERT INTO events_fts(events_fts, rowid, counterparty)
  VALUES ('delete', old.rowid, old.counterparty);
END;

CREATE TRIGGER IF NOT EXISTS events_au AFTER UPDATE ON events BEGIN
  INSERT INTO events_fts(events_fts, rowid, counterparty)
  VALUES ('delete', old.rowid, old.counterparty);
  INSERT INTO events_fts(rowid, counterparty)
  VALUES (new.rowid, new.counterparty);
END;

-- Performance indexes 
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type_category ON events(type, category);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_raw_hash ON events(raw_hash);
CREATE INDEX IF NOT EXISTS idx_credit_customers_name ON credit_customers(name);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer ON credit_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_due_date ON credit_transactions(due_date, status);
`;

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  static async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;
    
    const db = await SQLite.openDatabaseAsync('ledger.db');
    
    // Enable WAL and foreign keys
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Run schema initialization
    await db.execAsync(SCHEMA_SQL);
    
    // Initialize balance if empty
    const balanceResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM balances');
    if (balanceResult?.count === 0) {
      await db.runAsync('INSERT INTO balances (id, balance, last_updated) VALUES (1, 0, ?)', [Date.now()]);
    }
    
    this.db = db;
    return db;
  }

  static async nextDeviceSeq(): Promise<number> {
    const db = await this.getDb();
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT OR IGNORE INTO kv(key, value) VALUES('device_seq', '0');
    `);
    
    await db.runAsync(`UPDATE kv SET value = CAST(value AS INTEGER) + 1 WHERE key = 'device_seq';`);
    
    const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM kv WHERE key = 'device_seq';`);
    return Number(row?.value ?? 0);
  }
}
