import { getDb, toSale } from '../db';
import { INT_MAX, INT_MIN } from '../validation';
import type { Sale, SaleRow } from '../types';

const SELECT_COLUMNS = 'id, "Name", "Author", "Quantity", "Sale Price", "Pay"';

const NUMBER_PREFIX = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eEdD][+-]?\d+)?/;

/**
 * VB6 Val(): converts the leading numeric part of a string to a number, 0 when there is
 * none. Numbers pass through; null/undefined are 0.
 */
export function vbVal(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const match = NUMBER_PREFIX.exec(value.replace(/\s+/g, ''));
  if (!match) return 0;
  const parsed = Number(match[0].replace(/[dD]/, 'e'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Line total: Val(quantity * salePrice), rounded to remove floating point noise. */
export function computePay(quantity: unknown, salePrice: unknown): number {
  const total = vbVal(quantity) * vbVal(salePrice);
  if (!Number.isFinite(total)) return 0;
  return Math.round(total * 1e6) / 1e6;
}

export interface SaleLineInput {
  name: string;
  author?: string;
  quantity?: string | number | null;
  salePrice?: string | number | null;
}

export class SaleValidationError extends Error {}

export function listSales(): Sale[] {
  const rows = getDb().prepare(`SELECT ${SELECT_COLUMNS} FROM SalesDetails ORDER BY id`).all() as SaleRow[];
  return rows.map(toSale);
}

export function getSale(id: number): Sale | undefined {
  const row = getDb().prepare(`SELECT ${SELECT_COLUMNS} FROM SalesDetails WHERE id = ?`).get(id) as
    | SaleRow
    | undefined;
  return row ? toSale(row) : undefined;
}

/**
 * Persists one sale line (the source bound SalesDetails but never wrote to it).
 * Pay is computed on the server; stock is left untouched.
 */
export function createSale(input: SaleLineInput): Sale {
  const quantity = vbVal(input.quantity);
  if (!Number.isInteger(quantity) || quantity < INT_MIN || quantity > INT_MAX) {
    throw new SaleValidationError(`quantity: Must be a whole number between ${INT_MIN} and ${INT_MAX}`);
  }
  const salePrice = vbVal(input.salePrice);
  const pay = computePay(quantity, salePrice);
  const result = getDb()
    .prepare('INSERT INTO SalesDetails ("Name", "Author", "Quantity", "Sale Price", "Pay") VALUES (?, ?, ?, ?, ?)')
    .run(input.name, input.author ?? '', quantity, salePrice, pay);
  return getSale(Number(result.lastInsertRowid)) as Sale;
}
