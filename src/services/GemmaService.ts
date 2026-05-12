import React, { useEffect } from 'react';
import { useModel } from 'react-native-litert-lm';
import { ModelManager } from './ModelManager';
import { useModelStore } from '../store/useModelStore';

export interface StructuredEntry {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  counterparty?: string;
}

const SYSTEM_PROMPT = `You are Ledger, an offline financial assistant. Your job is to extract structured data from user input or answer questions about their finances. Always respond with valid JSON for extraction tasks. Be concise and helpful.`;

const EXTRACTION_PROMPT = `Extract the following from the user's text:
- amount (number in local currency, no commas)
- type ("income" or "expense")
- category (from: food, transport, supplies, utilities, other)
- counterparty (person or store name, optional)

Output ONLY valid JSON. No explanations.

Input: {input}
Output:`;

const SQL_PROMPT = `Convert this natural language question about finances to a SQLite WHERE clause. 
Table columns: amount (INTEGER), type (TEXT: 'income'/'expense'), category (TEXT), counterparty (TEXT), timestamp (INTEGER, epoch ms).
Today's date: {today}

Output ONLY the WHERE clause. No explanations. Use proper SQLite date functions.

Question: "{query}"
WHERE clause:`;

export function useGemmaService() {
  const { isGemmaDownloaded } = useModelStore();
  
  console.log('[LEDGER_DEBUG] Initializing GemmaService hook...');

  const modelHook = useModel(ModelManager.getModelPath('gemma'), {
    backend: 'cpu',
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 512,
    temperature: 0.1,
    enableMemoryTracking: true,
    autoLoad: false,
  });

  useEffect(() => {
    console.log('[LEDGER_DEBUG] GemmaService useEffect triggered', { isGemmaDownloaded, isReady: modelHook.isReady });
    if (isGemmaDownloaded && !modelHook.isReady) {
      console.log('[LEDGER_DEBUG] Attempting to load Gemma model...');
      modelHook.load()
        .then(() => console.log('[LEDGER_DEBUG] Gemma model loaded successfully'))
        .catch(err => console.error('[LEDGER_DEBUG] Gemma model load failed:', err));
    }
  }, [isGemmaDownloaded, modelHook.isReady]);

  const extractLedgerEntry = async (inputText: string): Promise<StructuredEntry> => {
    console.log('[LEDGER_DEBUG] Extracting ledger entry from:', inputText);
    if (!modelHook.isReady || !modelHook.model) {
      console.error('[LEDGER_DEBUG] Extraction failed: Model not ready');
      throw new Error('Model not ready');
    }

    const prompt = EXTRACTION_PROMPT.replace('{input}', inputText);
    console.log('[LEDGER_DEBUG] Generating extraction response...');
    const response = await modelHook.generate(prompt);
    console.log('[LEDGER_DEBUG] Gemma extraction response received');

    try {
      const parsed = JSON.parse(response);
      console.log('[LEDGER_DEBUG] Parsed entry:', parsed);
      return {
        amount: Number(parsed.amount),
        type: parsed.type,
        category: parsed.category,
        counterparty: parsed.counterparty,
      };
    } catch (error) {
      console.error('[LEDGER_DEBUG] Failed to parse Gemma response:', response);
      throw new Error('Failed to extract transaction data');
    }
  };

  const generateSQLWhere = async (query: string): Promise<string> => {
    const prompt = SQL_PROMPT
      .replace('{query}', query)
      .replace('{today}', new Date().toISOString().split('T')[0]);

    const response = await modelHook.generate(prompt);

    return response.trim();
  };

  const analyzeReceipt = async (imageUri: string): Promise<StructuredEntry> => {
    if (!modelHook.isReady || !modelHook.model) {
      throw new Error('Model not ready');
    }

    const response = await modelHook.model.sendMessageWithImage(
      "Analyze this receipt and extract: amount, type (income/expense), category (food, transport, supplies, utilities, other), and counterparty. Output ONLY valid JSON.",
      imageUri
    );

    try {
      const parsed = JSON.parse(response);
      return {
        amount: Number(parsed.amount),
        type: parsed.type,
        category: parsed.category,
        counterparty: parsed.counterparty,
      };
    } catch (error) {
      console.error('Failed to parse Gemma multimodal response:', response);
      throw new Error('Failed to analyze receipt');
    }
  };

  return {
    ...modelHook,
    extractLedgerEntry,
    generateSQLWhere,
    analyzeReceipt,
  };
}
