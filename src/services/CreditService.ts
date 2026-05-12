import * as Crypto from 'expo-crypto';
import { DatabaseService } from './DatabaseService';

export interface CreditCustomer {
  id: string;
  name: string;
  phone?: string;
  totalOwed: number;
  totalPaid: number;
}

export class CreditService {
  static async addCustomer(name: string, phone?: string): Promise<string> {
    const db = await DatabaseService.getDb();
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO credit_customers (id, name, phone, created_at, total_owed, total_paid)
       VALUES (?, ?, ?, ?, 0, 0)`,
      [id, name, phone || null, Date.now()]
    );
    return id;
  }

  static async getCustomers(): Promise<CreditCustomer[]> {
    const db = await DatabaseService.getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM credit_customers ORDER BY name ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      totalOwed: r.total_owed,
      totalPaid: r.total_paid
    }));
  }

  static async recordCreditSale(customerId: string, amount: number, dueDate: number): Promise<void> {
    const db = await DatabaseService.getDb();
    const id = Crypto.randomUUID();
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO credit_transactions (id, customer_id, amount, due_date, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [id, customerId, amount, dueDate, now]
    );

    await db.runAsync(
      `UPDATE credit_customers SET total_owed = total_owed + ? WHERE id = ?`,
      [amount, customerId]
    );
  }
}
