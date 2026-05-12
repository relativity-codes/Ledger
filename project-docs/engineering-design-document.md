# Ledger: Engineering Design Document

**Version:** 3.0 (Final)
**Date:** May 2026
**Target Platform:** Android 10+ (iOS planned for v2)
**Core Stack:** React Native + Expo + react-native-litert-lm@0.3.7

---

## Table of Contents

1. Executive Summary
2. System Architecture
3. Technology Stack
4. Core Component Design
5. Data Architecture
6. AI & Model Integration
7. Multimodal Pipeline Design
8. Security & Privacy Architecture
9. Performance Targets & Optimization
10. Error Handling & Edge Cases
11. Testing Strategy
12. Deployment & Operations
13. Development Roadmap
14. Technical Risks & Mitigations
15. Appendices

---

## 1. Executive Summary

### 1.1 Document Purpose

This document provides the complete technical architecture, implementation details, and development plan for **Ledger** - an offline-first, multimodal financial assistant for informal workers.

### 1.2 Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| React Native + Expo | 3x faster development than native, config plugins for native modules |
| `react-native-litert-lm` | High-performance Nitro Module bridge to LiteRT-LM |
| Gemma 4 E2B (2B active params) | Fits in 1.5GB RAM, multimodal native support for Vision/Text  |
| SQLite (expo-sqlite) | Offline-first, ACID compliance, sub-100ms queries  |
| Expo Speech Recognition | System-native offline ASR, no additional binary size  |
| Gemma Vision | Multimodal extraction eliminates separate OCR model complexity |

### 1.3 Core Metrics

| Metric | Target |
|--------|--------|
| Transaction entry latency (voice) | ≤ 3.5s p95 |
| Model inference (E2B decode) | ~47 tokens/sec on CPU, ~52 on GPU  |
| Peak RAM usage | < 1.5GB (E2B active memory)  |
| Battery per transaction | < 0.5% |
| Cold start time (first inference) | Pre-warm during splash screen |
| App size (without model) | < 100MB (Play Asset Delivery for model) |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ Voice UI │ │ Camera   │ │ SMS List │ │ Ledger Dashboard   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘ │
├───────┴────────────┴────────────┴───────────────┴───────────────┤
│                        BUSINESS LOGIC LAYER                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Input Router                                                 │ │
│  │  - Routes text/voice/image/sms to appropriate pipeline      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ LedgerEngine                                                │ │
│  │  - Validation, deduplication, balance computation           │ │
│  │  - Credit tracking, anomaly detection                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         AI INFERENCE LAYER                        │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ LiteRT-LM    │ │ Expo     │ │ Gemma    │ │ Expo         │   │
│  │ (Gemma 4)    │ │ SpeechRec│ │ Vision   │ │ Speech       │   │
│  │              │ │ (STT)    │ │ (OCR)    │ │ (TTS)        │   │
│  │ • Extraction │ │ • Voice  │ │ • Receipt│ │ • Spoken     │   │
│  │ • Queries    │ │   to text│ │   Vision │ │   responses  │   │
│  │ • Vision     │ │          │ │          │ │              │   │
│  └──────────────┘ └──────────┘ └──────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ SQLite (expo-sqlite)                                        │ │
│  │  - Append-only event ledger                                 │ │
│  │  - Materialized views for balances                          │ │
│  │  - FTS5 for natural language search             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                    ALL LAYERS RUN 100% OFFLINE
                    NO INTERNET PERMISSION REQUIRED
```

### 2.2 Module Dependencies

```
Ledger App
├── react-native-litert-lm (LLM inference) 
│   ├── Downloads Gemma 4 E2B .litertlm file (~2.58 GB)
│   ├── Manages inference on CPU/GPU/NPU
│   └── Native Vision processing
├── expo-sqlite (Local database)
├── expo-speech-recognition (System STT) 
├── expo-camera (Receipt capture)
├── expo-image-manipulator (Image prep)
└── expo-speech (System TTS)
```

### 2.3 Data Flow

**Transaction Creation Flow:**

```
[User Voice Input]
       ↓
[Expo SpeechRec] → "paid 200 for vegetables"
       ↓
[Gemma 4 E2B] → JSON: {"amount":200, "type":"expense", "category":"food"}
       ↓
[LedgerEngine.addEntry()] → SQLite INSERT
       ↓
[Expo Speech] → "Added expense of 200 rupees. Balance: 1,450"
```

**Query Flow:**

```
[User: "How much did I spend last week?"]
       ↓
[Gemma 4 E2B (query mode)] → SQL WHERE clause generation
       ↓
[SQLite SELECT with FTS5] → Fetch matching entries 
       ↓
[Gemma 4 E2B (summary mode)] → Format results as natural language
       ↓
[Piper TTS] → Spoken response
```

---

## 3. Technology Stack

### 3.1 Core Dependencies

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| Framework | React Native + Expo | SDK 55 | Cross-platform development |
| LLM Bridge | react-native-litert-lm | 0.3.7 | Gemma 4 inference + Vision |
| Database | expo-sqlite | 15.0+ | Local ledger storage |
| Speech-to-Text | expo-speech-recognition | 3.1+ | System-native offline ASR |
| Camera | expo-camera | 16.0+ | Receipt capture |
| Image Prep | expo-image-manipulator | 13.0+ | Vision preprocessing |
| TTS | expo-speech | 13.0+ | Spoken responses |
| Crypto | expo-crypto | 13.0+ | UUID generation |

### 3.2 Model Files & Sources

| Model | Source | Size | Active RAM | Load Method |
|-------|--------|------|------------|-------------|
| Gemma 4 E2B IT | HuggingFace (via library) | 2.58 GB | <1.5 GB | `GEMMA_4_E2B_IT` constant  |
| Vosk (English) | Vosk website | 50 MB | 80 MB | `loadModel()`  |
| Piper TTS (English) | Piper website | 5 MB | 30 MB | Local file |
| TFLite EasyOCR | Custom training | 3 MB | 50 MB | Local asset |

### 3.3 Development Environment

```bash
# Create Expo project
npx create-expo-app Ledger --template blank-typescript

# Install core dependencies
npx expo install expo-sqlite expo-crypto expo-av expo-image-picker

# Install AI/ML libraries
npm install react-native-litert-lm react-native-nitro-modules
npm install react-native-vosk
npm install react-native-vision-camera
npm install react-native-fast-tflite

# Prebuild for native modules
npx expo prebuild

# Run development build
npx expo run:android
```

**Important:** `react-native-litert-lm` does NOT work with Expo Go. A development build is required. 

---

## 4. Core Component Design

### 4.1 Input Router

```typescript
// services/InputRouter.ts
import { Platform } from 'react-native';
import { transcribeAudio } from './VoskService';
import { extractTextFromImage } from './OCRService';
import { gemmaExtract } from './GemmaService';

export type InputSource = 'voice' | 'image' | 'sms' | 'manual';
export type RawInput = {
  source: InputSource;
  text?: string;
  audioUri?: string;
  imageUri?: string;
  smsBody?: string;
  timestamp: number;
};

export class InputRouter {
  async process(raw: RawInput): Promise<StructuredEntry> {
    let text = raw.text;
    
    // Route based on source
    if (raw.source === 'voice' && raw.audioUri) {
      text = await transcribeAudio(raw.audioUri);
    } else if (raw.source === 'image' && raw.imageUri) {
      text = await extractTextFromImage(raw.imageUri);
    } else if (raw.source === 'sms' && raw.smsBody) {
      text = raw.smsBody;
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from input');
    }
    
    // Extract structured data using Gemma 4
    const structured = await gemmaExtract(text);
    return structured;
  }
}
```

### 4.2 LedgerEngine

```typescript
// services/LedgerEngine.ts
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export type LedgerEntry = {
  id: string;
  timestamp: number;
  amount: number;        // in smallest currency unit (cents)
  type: 'income' | 'expense';
  category: string;      // food, transport, supplies, utilities, other
  counterparty: string | null;
  source: InputSource;
  rawInputHash: string;
  isPending: boolean;
  // Credit-specific fields
  creditCustomerId?: string;
  creditDueDate?: number;
  creditStatus?: 'pending' | 'paid' | 'overdue';
};

export class LedgerEngine {
  private db: SQLite.SQLiteDatabase;
  
  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }
  
  async addEntry(raw: RawInput, structured: StructuredEntry): Promise<LedgerEntry> {
    const now = Date.now();
    const id = Crypto.randomUUID();
    const rawHash = await this.hashRawInput(raw);
    
    // Check duplicate (same raw input within 30 seconds)
    const duplicate = await this.checkDuplicate(rawHash, now);
    if (duplicate) {
      throw new Error('Duplicate transaction detected');
    }
    
    // Validate structured data
    this.validateEntry(structured);
    
    const entry: LedgerEntry = {
      id,
      timestamp: now,
      amount: structured.amount,
      type: structured.type,
      category: structured.category,
      counterparty: structured.counterparty || null,
      source: raw.source,
      rawInputHash: rawHash,
      isPending: false,
    };
    
    // Append-only insert
    await this.db.runAsync(
      `INSERT INTO events (id, timestamp, amount, type, category, counterparty, source, raw_hash, is_pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, now, entry.amount, entry.type, entry.category, entry.counterparty, entry.source, rawHash, 0]
    );
    
    // Update materialized balance
    await this.updateBalance(entry.type === 'income' ? entry.amount : -entry.amount);
    
    // Trigger anomaly detection (async, don't block)
    this.checkAnomaly(entry);
    
    return entry;
  }
  
  async addCreditCustomer(name: string): Promise<string> {
    const id = Crypto.randomUUID();
    await this.db.runAsync(
      `INSERT INTO credit_customers (id, name, created_at, total_owed, total_paid)
       VALUES (?, ?, ?, 0, 0)`,
      [id, name, Date.now()]
    );
    return id;
  }
  
  async recordCreditSale(customerId: string, amount: number, dueDate: number): Promise<void> {
    const id = Crypto.randomUUID();
    await this.db.runAsync(
      `INSERT INTO credit_transactions (id, customer_id, amount, due_date, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [id, customerId, amount, dueDate, Date.now()]
    );
    
    // Update customer's total owed
    await this.db.runAsync(
      `UPDATE credit_customers SET total_owed = total_owed + ? WHERE id = ?`,
      [amount, customerId]
    );
  }
  
  private async checkAnomaly(entry: LedgerEntry): Promise<void> {
    // Get last 7 days of expenses in this category
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const result = await this.db.getAllAsync(
      `SELECT AVG(amount) as avg_amount, COUNT(*) as count
       FROM events
       WHERE type = 'expense' 
         AND category = ? 
         AND timestamp > ?
         AND timestamp < ?`,
      [entry.category, weekAgo, entry.timestamp]
    );
    
    const avgAmount = result[0]?.avg_amount || 0;
    const threshold = avgAmount * 1.3; // 30% above average
    
    if (entry.amount > threshold && entry.amount > 100) { // Minimum threshold
      // Emit anomaly event for UI to handle
      this.emit('anomaly', {
        entry,
        expectedMax: threshold,
        reason: `30% above typical ${entry.category} spend`
      });
    }
  }
}
```

### 4.3 Query Engine with FTS5

Using SQLite FTS5 for fast natural language search :

```typescript
// services/QueryEngine.ts
import * as SQLite from 'expo-sqlite';
import { gemmaGenerate } from './GemmaService';

export class QueryEngine {
  private db: SQLite.SQLiteDatabase;
  
  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }
  
  async setupFTSSchema() {
    await this.db.execAsync(`
      -- Main events table
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        counterparty TEXT,
        source TEXT NOT NULL,
        raw_hash TEXT NOT NULL,
        is_pending INTEGER DEFAULT 0
      );
      
      -- FTS5 virtual table for full-text search
      CREATE VIRTUAL TABLE IF NOT EXISTS events_fts 
      USING fts5(
        counterparty,
        content='events',
        content_rowid='rowid',
        tokenize='unicode61 remove_diacritics 2'
      );
      
      -- Triggers to keep FTS in sync
      CREATE TRIGGER IF NOT EXISTS events_ai AFTER INSERT ON events BEGIN
        INSERT INTO events_fts(rowid, counterparty)
        VALUES (new.rowid, new.counterparty);
      END;
      
      CREATE TRIGGER IF NOT EXISTS events_ad AFTER DELETE ON events BEGIN
        INSERT INTO events_fts(events_fts, rowid, counterparty)
        VALUES ('delete', old.rowid, old.counterparty);
      END;
      
      -- Index for time-based queries
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_type_category ON events(type, category);
    `);
  }
  
  async naturalLanguageQuery(userQuery: string): Promise<string> {
    // Step 1: Convert natural language to SQL using Gemma 4
    const sqlPrompt = `Convert this user question to a SQLite WHERE clause for a table with columns: amount, type (income/expense), category, counterparty, timestamp (epoch ms), source. Today's date is ${new Date().toISOString().split('T')[0]}. Output ONLY the WHERE clause, no explanation.
    
    Question: "${userQuery}"
    
    Examples:
    - "last week's expenses" → "type='expense' AND timestamp >= strftime('%s','now','-7 days')*1000"
    - "payments from Ramesh" → "counterparty='Ramesh'"
    - "how much on food" → "category='food'"
    
    WHERE clause:`;
    
    const whereClause = await gemmaGenerate(sqlPrompt, { maxTokens: 100, temperature: 0.1 });
    
    // Step 2: Execute query
    const sql = `SELECT * FROM events WHERE ${whereClause} ORDER BY timestamp DESC LIMIT 20`;
    const results = await this.db.getAllAsync(sql);
    
    if (results.length === 0) {
      return "I couldn't find any transactions matching your question.";
    }
    
    // Step 3: Summarize results with Gemma 4
    const summaryPrompt = `Summarize these financial transactions for the user. Be concise and friendly. Use the user's local currency (rupees/shillings/etc).
    
    Transactions: ${JSON.stringify(results)}
    
    Summary:`;
    
    const summary = await gemmaGenerate(summaryPrompt, { maxTokens: 150, temperature: 0.3 });
    return summary;
  }
  
  async getBalance(): Promise<number> {
    const result = await this.db.getFirstAsync(
      `SELECT SUM(CASE WHEN type='income' THEN amount ELSE -amount END) as balance FROM events WHERE is_pending=0`
    );
    return result?.balance || 0;
  }
}
```

---

## 5. Data Architecture

### 5.1 Database Schema (Complete)

Based on append-only event sourcing principles :

```sql
-- Core events table (append-only ledger)
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK(category IN ('food', 'transport', 'supplies', 'utilities', 'other')),
  counterparty TEXT,
  source TEXT NOT NULL CHECK(source IN ('voice', 'image', 'sms', 'manual')),
  raw_hash TEXT NOT NULL,
  is_pending INTEGER DEFAULT 0,
  device_seq INTEGER NOT NULL,      -- Monotonic sequence for sync order 
  created_at INTEGER NOT NULL
);

-- Materialized balances (for fast queries)
CREATE TABLE balances (
  id INTEGER PRIMARY KEY CHECK(id=1),
  balance INTEGER NOT NULL,
  last_updated INTEGER NOT NULL
);

-- Credit customers
CREATE TABLE credit_customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at INTEGER NOT NULL,
  total_owed INTEGER DEFAULT 0,
  total_paid INTEGER DEFAULT 0
);

-- Credit transactions (append-only)
CREATE TABLE credit_transactions (
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
CREATE VIRTUAL TABLE events_fts USING fts5(
  counterparty,
  content='events',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

-- Triggers for FTS sync
CREATE TRIGGER events_ai AFTER INSERT ON events BEGIN
  INSERT INTO events_fts(rowid, counterparty)
  VALUES (new.rowid, new.counterparty);
END;

CREATE TRIGGER events_ad AFTER DELETE ON events BEGIN
  INSERT INTO events_fts(events_fts, rowid, counterparty)
  VALUES ('delete', old.rowid, old.counterparty);
END;

CREATE TRIGGER events_au AFTER UPDATE ON events BEGIN
  INSERT INTO events_fts(events_fts, rowid, counterparty)
  VALUES ('delete', old.rowid, old.counterparty);
  INSERT INTO events_fts(rowid, counterparty)
  VALUES (new.rowid, new.counterparty);
END;

-- Performance indexes 
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_type_category ON events(type, category);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_raw_hash ON events(raw_hash);
CREATE INDEX idx_credit_customers_name ON credit_customers(name);
CREATE INDEX idx_credit_transactions_customer ON credit_transactions(customer_id);
CREATE INDEX idx_credit_transactions_due_date ON credit_transactions(due_date, status);
```

### 5.2 Database Initialization

```typescript
// db/init.ts
import * as SQLite from 'expo-sqlite';

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('ledger.db');
  
  // Enable WAL for better performance
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  
  // Run schema migration
  await db.execAsync(SCHEMA_SQL);
  
  // Initialize balance if empty
  const balanceResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM balances');
  if (balanceResult?.count === 0) {
    await db.runAsync('INSERT INTO balances (id, balance, last_updated) VALUES (1, 0, ?)', [Date.now()]);
  }
  
  return db;
}

// Device sequence generator (atomic increment) 
export async function nextDeviceSeq(db: SQLite.SQLiteDatabase): Promise<number> {
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT OR IGNORE INTO kv(key, value) VALUES('device_seq', '0');
  `);
  
  await db.runAsync(`UPDATE kv SET value = CAST(value AS INTEGER) + 1 WHERE key = 'device_seq';`);
  
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM kv WHERE key = 'device_seq';`);
  return Number(row?.value ?? 0);
}
```

---

## 6. AI & Model Integration

### 6.1 Gemma 4 E2B via react-native-litert-lm

**Model Selection:** Use `GEMMA_4_E2B_IT` for optimal balance of quality and performance. 

**Key properties:**
- 2.58 GB file size
- <1.5 GB active memory 
- ~52 tokens/sec decode on GPU 
- 140 languages supported
- Multimodal (text + vision + audio)

```typescript
// services/GemmaService.ts
import { useModel, GEMMA_4_E2B_IT } from 'react-native-litert-lm';

// Configuration for Ledger use cases
const MODEL_CONFIG = {
  backend: 'cpu' as const,    // CPU for maximum compatibility; switch to 'gpu' for flagships
  maxTokens: 256,
  temperature: 0.2,            // Low temperature for deterministic extraction
  topP: 0.9,
  enableMemoryTracking: true,
  systemPrompt: `You are Ledger, an offline financial assistant. Your job is to extract structured data from user input or answer questions about their finances. Always respond with valid JSON for extraction tasks. Be concise and helpful.`
};

// Extraction prompt
const EXTRACTION_PROMPT = `Extract the following from the user's text:
- amount (number in local currency, no commas)
- type ("income" or "expense")
- category (from: food, transport, supplies, utilities, other)
- counterparty (person or store name, optional)

Output ONLY valid JSON. No explanations.

Input: {input}
Output:`;

// Query-to-SQL prompt
const SQL_PROMPT = `Convert this natural language question about finances to a SQLite WHERE clause. 
Table columns: amount (INTEGER), type (TEXT: 'income'/'expense'), category (TEXT), counterparty (TEXT), timestamp (INTEGER, epoch ms).
Today's date: {today}

Output ONLY the WHERE clause. No explanations. Use proper SQLite date functions.

Question: "{query}"
WHERE clause:`;

// In your component
export function useGemma() {
  const [extractResponse, setExtractResponse] = useState('');
  
  const {
    model,
    isReady,
    downloadProgress,
    error,
    generate,
    generateStream,
    memorySummary,
  } = useModel(GEMMA_4_E2B_IT, {
    backend: 'cpu',
    systemPrompt: MODEL_CONFIG.systemPrompt,
    enableMemoryTracking: true,
    autoLoad: true,
  });
  
  const extractLedgerEntry = async (inputText: string): Promise<StructuredEntry> => {
    if (!isReady || !model) {
      throw new Error('Model not ready');
    }
    
    const prompt = EXTRACTION_PROMPT.replace('{input}', inputText);
    const response = await generate(prompt, {
      maxTokens: 150,
      temperature: 0.2,
    });
    
    try {
      // Parse JSON response
      const parsed = JSON.parse(response);
      return {
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        counterparty: parsed.counterparty,
      };
    } catch (error) {
      console.error('Failed to parse Gemma response:', response);
      throw new Error('Failed to extract transaction data');
    }
  };
  
  const generateSQLWhere = async (query: string): Promise<string> => {
    const prompt = SQL_PROMPT
      .replace('{query}', query)
      .replace('{today}', new Date().toISOString().split('T')[0]);
    
    const response = await generate(prompt, {
      maxTokens: 100,
      temperature: 0.1,
    });
    
    return response.trim();
  };
  
  return {
    isReady,
    downloadProgress,
    error,
    memorySummary,
    extractLedgerEntry,
    generateSQLWhere,
  };
}
```

### 6.2 Cold Start Optimization

**Important:** First inference has real latency as model loads into memory. Pre-warm at app launch: 

```typescript
// App.tsx
useEffect(() => {
  if (isReady && model) {
    // Pre-warm with minimal prompt
    const warmUp = async () => {
      await generate('Hello', { maxTokens: 1 });
      console.log('Model warmed up');
    };
    warmUp();
  }
}, [isReady, model]);
```

### 6.3 Vosk ASR Integration

```typescript
// services/VoskService.ts
import Vosk from 'react-native-vosk';
import { Audio } from 'expo-av';

let voskInstance: any = null;

export async function initializeVosk(): Promise<void> {
  voskInstance = new Vosk();
  
  // Load model from assets (or downloaded path)
  // Model must be in assets/model-en-en/ folder 
  await voskInstance.loadModel('model-en-en');
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!voskInstance) {
    await initializeVosk();
  }
  
  return new Promise((resolve, reject) => {
    // Start recognition with timeout
    voskInstance.start({ timeout: 3000 });
    
    // Play audio file through recognizer
    // Note: Vosk expects microphone input, so for file transcription,
    // you may need to stream the file through the recognizer
    
    voskInstance.onResult((result: string) => {
      resolve(result);
      voskInstance.stop();
    });
    
    voskInstance.onError((error: string) => {
      reject(new Error(error));
      voskInstance.stop();
    });
    
    voskInstance.onTimeout(() => {
      reject(new Error('Recognition timeout'));
    });
  });
}

// For live recording
let recording: Audio.Recording | null = null;

export async function startLiveRecording(): Promise<void> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  
  recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
  await recording.startAsync();
  
  // Start Vosk recognizer
  voskInstance.start({ timeout: 5000 });
}

export async function stopLiveRecording(): Promise<string> {
  await recording?.stopAndUnloadAsync();
  
  return new Promise((resolve) => {
    voskInstance.onResult((result: string) => {
      resolve(result);
    });
    
    voskInstance.onTimeout(() => {
      resolve(''); // No speech detected
    });
  });
}
```

### 6.4 TFLite OCR Integration

For receipt text extraction:

```typescript
// services/OCRService.ts
import * as ImageManipulator from 'expo-image-manipulator';
import { TFLite } from 'react-native-fast-tflite';

// Load OCR model at startup
export async function loadOCRModel(): Promise<void> {
  await TFLite.loadModel({
    model: 'easyocr_quantized.tflite',
    labels: 'ocr_labels.txt',
  });
}

export async function extractTextFromImage(imageUri: string): Promise<string> {
  // Preprocess image: grayscale, resize to 640x480
  const processed = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      { resize: { width: 640, height: 480 } },
      { grayscale: true },
    ],
    { format: ImageManipulator.SaveFormat.JPEG }
  );
  
  // Run inference
  const result = await TFLite.runModelOnImage({
    path: processed.uri,
    numResults: 10,
    threshold: 0.7,
  });
  
  // Combine detected text blocks
  const textBlocks = result.map((r: any) => r.text).filter(Boolean);
  return textBlocks.join(' ');
}
```

---

## 7. Multimodal Pipeline Design

### 7.1 Voice Transaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      VOICE TRANSACTION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User taps microphone button                                 │
│           ↓                                                     │
│  2. Request Audio Permission (expo-av)                          │
│           ↓                                                     │
│  3. Start Recording + Vosk recognizer               │
│           ↓                                                     │
│  4. User speaks: "paid 200 for vegetables"                      │
│           ↓                                                     │
│  5. Silence detected / timeout → Stop recording                 │
│           ↓                                                     │
│  6. Vosk.onResult() → "paid 200 for vegetables"                 │
│           ↓                                                     │
│  7. Show spinner: "Processing..."                               │
│           ↓                                                     │
│  8. Gemma 4 extraction → {"amount":200,"type":"expense",...}    │
│           ↓                                                     │
│  9. LedgerEngine validation + insert                            │
│           ↓                                                     │
│ 10. Piper TTS: "Added expense of 200 rupees"                    │
│           ↓                                                     │
│ 11. Update UI balance display                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Total expected latency: 2.5-3.5 seconds
```

### 7.2 Image Transaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      IMAGE TRANSACTION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User taps camera button                                     │
│           ↓                                                     │
│  2. Camera opens (react-native-vision-camera)                   │
│           ↓                                                     │
│  3. User captures receipt/note photo                            │
│           ↓                                                     │
│  4. Show processing overlay                                     │
│           ↓                                                     │
│  5. Preprocess (grayscale, resize)                              │
│           ↓                                                     │
│  6. TFLite OCR → text extraction                                │
│           ↓                                                     │
│  7. If confidence <70%: attempt Gemma 4 direct reading          │
│           ↓                                                     │
│  8. Gemma 4 extraction from OCR text                            │
│           ↓                                                     │
│  9. Display extracted data for user confirmation                │
│           ↓                                                     │
│ 10. User confirms or edits                                      │
│           ↓                                                     │
│ 11. LedgerEngine.insert()                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Total expected latency: 3.5-4.5 seconds
```

### 7.3 SMS Auto-Logging Flow

```typescript
// services/SMSService.ts (Android only)
import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as SMS from 'expo-sms'; // For sending only, not receiving

// For receiving SMS, need native module or background task
// Alternative: User manually copies SMS text

// User-initiated SMS import
export async function importSmsFromClipboard(): Promise<string | null> {
  const clipboardContent = await Clipboard.getStringAsync();
  
  // Check if it looks like a bank SMS
  const bankKeywords = ['credited', 'debited', 'balance', 'INR', 'KES', 'transaction'];
  if (bankKeywords.some(kw => clipboardContent.toLowerCase().includes(kw))) {
    return clipboardContent;
  }
  return null;
}

// Manual SMS entry fallback
export function SMSEntryModal({ onSave }: { onSave: (text: string) => void }) {
  const [smsText, setSmsText] = useState('');
  
  return (
    <Modal>
      <Text>Paste or type the SMS content:</Text>
      <TextInput 
        multiline 
        value={smsText} 
        onChangeText={setSmsText}
        placeholder="FROM: BANK Your account ending 1234 was debited 500..."
      />
      <Button title="Log Transaction" onPress={() => onSave(smsText)} />
    </Modal>
  );
}
```

---

## 8. Security & Privacy Architecture

### 8.1 Zero-Trust Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY BY DESIGN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ NO internet permission in production                         │
│  ✓ Zero telemetry or analytics                                  │
│  ✓ All models shipped with app or via Play Asset Delivery       │
│  ✓ No cloud fallback - 100% offline                            │
│  ✓ Transactions never leave SQLite                              │
│  ✓ Optional Bluetooth export (requires explicit user action)    │
│  ✓ Encrypted backup to microSD (AES-256)                        │
│  ✓ No third-party SDKs                                          │
│  ✓ App PIN lock optional                                        │
│  ✓ Raw microphone data deleted after ASR                        │
│  ✓ Images deleted after OCR                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Permission Strategy

```json
// app.json permissions (minimal required)
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",    // Voice input
        "android.permission.CAMERA",           // Receipt capture
        "android.permission.POST_NOTIFICATIONS" // Local reminders
        // NO INTERNET PERMISSION
        // NO READ_SMS - use manual import instead
      ]
    },
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Ledger needs microphone access to log transactions by voice",
        "NSCameraUsageDescription": "Ledger needs camera access to read receipts",
        "NSPhotoLibraryUsageDescription": "Ledger needs photo access to read receipt images"
      }
    }
  }
}
```

### 8.3 Data Encryption at Rest

```typescript
// services/EncryptionService.ts
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SQLite encryption is complex. Alternative: Encrypt sensitive fields
export class EncryptedLedgerEngine {
  private encryptionKey: string | null = null;
  
  async init(pin: string): Promise<void> {
    // Derive key from PIN
    const salt = await SecureStore.getItemAsync('ledger_salt');
    if (!salt) {
      const newSalt = Crypto.randomUUID();
      await SecureStore.setItemAsync('ledger_salt', newSalt);
    }
    
    // Use PIN + salt to derive encryption key
    // (Implementation using expo-crypto PBKDF2 when available)
  }
  
  async encryptSensitiveData(data: string): Promise<string> {
    // Encrypt counterparty names, etc.
    // Return base64-encoded ciphertext
  }
}
```

---

## 9. Performance Targets & Optimization

### 9.1 Target Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Transaction entry (voice) | ≤ 3.5s p95 | `performance.now()` timestamps |
| Transaction entry (image) | ≤ 4.5s p95 | Camera shutter to DB commit |
| Query response | ≤ 1.5s p95 | User query to TTS finish |
| App cold start (after model cached) | ≤ 2s | Splash screen to ready |
| Model warm-up | < 500ms | First inference after init |
| Battery drain (10 tx/day) | ≤ 5% | Android Battery Historian |
| Memory peak | < 1.5GB | `memorySummary` from lib  |

### 9.2 Optimization Strategies

**Model-Level Optimizations:**

| Strategy | Implementation |
|----------|----------------|
| 4-bit quantization | Already in E2B model  |
| CPU backend for compatibility | Use `backend: 'cpu'` in config |
| Pre-warm at launch | Send short prompt in background  |
| Cache model across sessions | Library handles this automatically |

**Database Optimizations:**

| Strategy | Implementation |
|----------|----------------|
| WAL mode | `PRAGMA journal_mode = WAL` |
| Prepared statements | Use parameterized queries |
| FTS5 for search | 10-100x faster than LIKE  |
| Proper indexes | Cover common query patterns  |
| Batch operations | Batch credit updates |

**UI Optimizations:**

| Strategy | Implementation |
|----------|----------------|
| Debounced search | 300ms delay before FTS query  |
| Skeleton screens | Show loading placeholders |
| Virtualized lists | `FlatList` with windowSize |
| Offline-first rendering | No network-dependent UI |

### 9.3 Memory Management

```typescript
// services/MemoryManager.ts
import { Platform } from 'react-native';
import { getMemorySummary } from 'react-native-litert-lm';

export class MemoryManager {
  private memoryWarningThreshold = 1400; // MB
  
  async checkMemory(): Promise<'ok' | 'warning' | 'critical'> {
    if (Platform.OS !== 'android') return 'ok';
    
    const summary = await getMemorySummary();
    const usedMB = summary.rssMB || 0;
    
    if (usedMB > this.memoryWarningThreshold) {
      console.warn(`High memory usage: ${usedMB}MB`);
      return 'warning';
    }
    return 'ok';
  }
  
  async freeMemoryIfNeeded(): Promise<void> {
    const status = await this.checkMemory();
    if (status === 'warning') {
      // Clear non-essential caches
      // Unload unused models
      // Suggest app restart to user
    }
  }
}
```

---

## 10. Error Handling & Edge Cases

### 10.1 Error Classification

| Error Type | Examples | Recovery Strategy |
|------------|----------|-------------------|
| **User input** | No speech detected, poor lighting | Show guidance, retry option |
| **Model failure** | ASR timeout, Gemma hallucination | Fallback to manual entry |
| **Storage** | Disk full, DB locked | Warn user, auto-clean old entries |
| **Permission** | Microphone denied | Show settings prompt |
| **Memory pressure** | OOM, high RSS | Suggest app restart, free caches |

### 10.2 Fallback Chain

```
Primary path fails
        ↓
Attempt alternative modality
        ↓
Fallback to manual text entry
        ↓
User can type or paste transaction
        ↓
Entry saved with 'manual' source flag
```

### 10.3 Error Handling Implementation

```typescript
// services/ErrorHandler.ts
export class LedgerErrorHandler {
  async handleExtractionError(raw: RawInput, error: Error): Promise<StructuredEntry | null> {
    console.error('Extraction failed:', error);
    
    // Try alternative approach based on error
    if (error.message.includes('No speech detected')) {
      // Show manual entry dialog
      return await this.showManualEntryDialog(raw);
    }
    
    if (error.message.includes('Model not ready')) {
      // Show loading indicator, retry after delay
      await delay(2000);
      return await this.retryExtraction(raw);
    }
    
    if (error.message.includes('Duplicate')) {
      // Silently ignore, user doesn't need to know
      return null;
    }
    
    // Ultimate fallback: manual entry modal
    return await this.showManualEntryDialog(raw);
  }
  
  private async showManualEntryDialog(raw: RawInput): Promise<StructuredEntry> {
    // Show modal with form: Amount, Type, Category, Counterparty
    return new Promise((resolve) => {
      // Render manual entry form
      // On submit: resolve with manual entry
    });
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// __tests__/LedgerEngine.test.ts
describe('LedgerEngine', () => {
  test('detects duplicate transactions within time window', async () => {
    const engine = new LedgerEngine(mockDb);
    const entry = { amount: 100, type: 'expense', category: 'food' };
    
    await engine.addEntry(entry);
    await expect(engine.addEntry(entry)).rejects.toThrow('Duplicate');
  });
  
  test('anomaly detection triggers on 30% above average', async () => {
    const engine = new LedgerEngine(mockDb);
    // Simulate 7 days of 100 rupee food expenses
    // Then add 150 rupee expense
    // Should trigger anomaly
  });
});
```

### 11.2 Integration Tests

- End-to-end voice → entry flow
- Camera → OCR → extraction flow
- Natural language query → SQL → response flow

### 11.3 Performance Tests

```typescript
// __tests__/performance/EntryLatency.test.ts
describe('Entry Latency', () => {
  test('voice entry under 3.5s p95', async () => {
    const latencies: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await simulateVoiceEntry(`Test transaction ${i}`);
      latencies.push(performance.now() - start);
    }
    
    const p95 = calculatePercentile(latencies, 95);
    expect(p95).toBeLessThan(3500);
  });
});
```

### 11.4 Memory Leak Testing

- Run 1000 transactions, monitor memory via `memorySummary`
- Cycle through all screens multiple times
- Test on low-end device (2GB RAM) with other apps running

---

## 12. Deployment & Operations

### 12.1 Play Store Deployment

**APK size management:** Model not bundled. Use Play Asset Delivery :

```json
// app.json
{
  "expo": {
    "android": {
      "assets": [
        {
          "path": "./assets/models/gemma4_e2b_4bit.task",
          "assetType": "model"
        }
      ]
    }
  }
}
```

Users download model on first launch (once, on WiFi recommended).

### 12.2 Model Update Strategy

| Update Type | Frequency | Mechanism |
|-------------|-----------|-----------|
| Gemma 4 model | Quarterly | Prompt re-download via in-app |
| ASR model | Bi-annually | Model file replacement |
| OCR model | As needed | TFLite file update |
| App code | Monthly | Play Store updates |

### 12.3 Analytics (Opt-in Only)

```typescript
// services/AnalyticsService.ts
import * as FileSystem from 'expo-file-system';

// NO automatic analytics
// User can opt-in to share anonymized usage data via Bluetooth
export class OptInAnalytics {
  async shareViaBluetooth(): Promise<void> {
    const anonymizedData = await this.generateAnonymizedReport();
    // Save to file, user can share via Bluetooth to nearby device
    const path = `${FileSystem.cacheDirectory}ledger_export.json`;
    await FileSystem.writeAsStringAsync(path, anonymizedData);
    await Share.share({ url: path });
  }
  
  private async generateAnonymizedReport(): Promise<string> {
    // Remove all PII
    // Aggregate by category only
    // No timestamps more precise than week
    return JSON.stringify({
      totalIncome: 10000,
      totalExpenses: 6000,
      categories: { food: 2000, transport: 1500, supplies: 2500 },
      anomalyCount: 3,
    });
  }
}
```

---

## 13. Development Roadmap

### Phase 1: Foundation (Weeks 1-2)

| Task | Deliverable | Dependencies |
|------|-------------|--------------|
| Expo project setup | Working dev build | None |
| Install core libraries | Package.json configured | Node.js 18+ |
| `react-native-litert-lm` integration | Model loads on device | Development build |
| Database schema | SQLite migration runs | expo-sqlite |

### Phase 2: Core Engine (Weeks 3-4)

| Task | Deliverable |
|------|-------------|
| LedgerEngine class | Validation, deduplication |
| Gemma extraction prompt | 90% accuracy on test set |
| SQLite CRUD operations | Entries save/retrieve |
| Unit tests | >80% coverage |

### Phase 3: Voice Input (Weeks 5-6)

| Task | Deliverable |
|------|-------------|
| Vosk ASR integration | 3s voice→text |
| Audio recording UI | Microphone button + animation |
| End-to-end voice entry | Complete flow working |
| TTS confirmation | Spoken responses |

### Phase 4: Multimodal (Weeks 7-8)

| Task | Deliverable |
|------|-------------|
| Camera integration | Capture receipts |
| OCR pipeline | Text extraction |
| SMS manual import | Clipboard + manual form |
| Image entry flow | Complete working |

### Phase 5: Features & Query (Weeks 9-10)

| Task | Deliverable |
|------|-------------|
| Credit customer tracking | Add/update/pay |
| FTS5 search setup | Fast query  |
| Natural language query | Gemma → SQL |
| Anomaly detection | Alerts on expense spikes |

### Phase 6: Polish & Field Test (Weeks 11-12)

| Task | Deliverable |
|------|-------------|
| UI polish | Icon-based summaries |
| Performance optimization | Meet all latency targets |
| Field test with 100 users | Feedback collection |
| Bug fixes | Stable release candidate |

---

## 14. Technical Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Gemma 4 inference >4s on low-end device**  | Medium | High | Use CPU backend, pre-warm, implement regex fallback for simple extracts |
| **Vosk ASR fails on regional accents** | Medium | Medium | Collect field recordings, fine-tune model on-device |
| **Model download fails in low-bandwidth** | High | Medium | Resume support, allow sideload via SD card |
| **OCR fails on thermal paper receipts** | Medium | Low | Gemma 4 can read visible numbers directly |
| **Memory pressure kills process** | Low | High | Monitor RSS, free caches, warn user to restart |
| **SMS permissions restricted** | High | Medium | Use manual import fallback (copy-paste) |
| **SQLite FTS5 syntax errors** | Low | Medium | Sanitize user input before FTS  |

---

## 15. Appendices

### Appendix A: Key File Structure

```
Ledger/
├── app.json                    # Expo config + plugin config
├── package.json
├── src/
│   ├── App.tsx
│   ├── db/
│   │   ├── init.ts            # Database initialization
│   │   ├── schema.sql         # Full schema
│   │   └── queries.ts         # Common queries
│   ├── services/
│   │   ├── LedgerEngine.ts    # Core business logic
│   │   ├── GemmaService.ts    # react-native-litert-lm wrapper
│   │   ├── VoskService.ts     # Speech recognition
│   │   ├── OCRService.ts      # Receipt OCR
│   │   ├── QueryEngine.ts     # Natural language queries
│   │   └── ErrorHandler.ts
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── VoiceEntryScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── LedgerScreen.tsx
│   │   └── CreditScreen.tsx
│   ├── components/
│   │   ├── BalanceCard.tsx
│   │   ├── TransactionList.tsx
│   │   └── AnomalyAlert.tsx
│   └── hooks/
│       ├── useGemma.ts
│       ├── useDatabase.ts
│       └── useVoiceInput.ts
├── assets/
│   ├── models/
│   │   └── gemma4_e2b_4bit.task  # Downloaded, not bundled
│   └── vosk-models/
│       └── model-en-en/           # Vosk model 
└── __tests__/
    ├── unit/
    └── integration/
```

### Appendix B: Environment Setup

```bash
# Minimum requirements
- Node.js 20+
- npm 10+
- Java 17 (for Android)
- Android Studio (for emulator/device)
- Physical device (recommended for performance testing)

# Install Expo CLI
npm install -g expo-cli

# Create project
npx create-expo-app Ledger --template blank-typescript
cd Ledger

# Prebuild for Android
npx expo prebuild --platform android

# Run on device
npx expo run:android
```

### Appendix C: Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| `react-native-litert-lm` not found | Ensure you've run `npx expo prebuild` after installing |
| Model download fails | Check storage space (>3GB free), retry on WiFi |
| Vosk model not loading | Model folder must start with `model-`  |
| FTS5 query returns no results | Check tokenizer settings, sanitize input  |
| App crashes on old device | Use CPU backend, reduce maxTokens, enable memory tracking |
| Permission denied on Android 14+ | Request permissions at runtime, handle denial gracefully |

---

## Document Sign-off

| Role | Name | Date |
|------|------|------|
| Technical Lead | [Name] | [Date] |
| ML Engineer | [Name] | [Date] |
| Product Manager | [Name] | [Date] |

---

**Next Steps:**

1. Phase 0 feasibility: Test Gemma 4 E2B on target Nokia C2 device
2. Set up development environment with Expo prebuild
3. Initialize `react-native-litert-lm` and verify model loads
4. Begin Phase 1 of roadmap

*"Ledger turns any smartphone into a financial brain that works without internet, reading, or typing."*