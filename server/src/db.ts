import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import Database from 'better-sqlite3';
import { getDbPath } from './config';
import type {
  Book,
  BookRow,
  Customer,
  CustomerRow,
  Order,
  OrderRow,
  Sale,
  SaleRow,
  UserRecord,
  UserRow,
} from './types';

export type Db = Database.Database;

/**
 * Schema of the 5 tables of DB_BKShopKK.mdb. Column names, types and text sizes
 * are those of the Access database; every table additionally gets an integer
 * autoincrement `id` so a specific row can be updated or deleted.
 * (Password has no length CHECK because it stores a scrypt hash, not the raw value.)
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS CustomerDetails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  "Name" VARCHAR(30) CHECK (length("Name") <= 30),
  "Moble" VARCHAR(15) CHECK (length("Moble") <= 15),
  "Email" VARCHAR(30) CHECK (length("Email") <= 30)
);

CREATE TABLE IF NOT EXISTS NewBook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  "Name" VARCHAR(25) CHECK (length("Name") <= 25),
  "Author" VARCHAR(25) CHECK (length("Author") <= 25),
  "Publication" VARCHAR(25) CHECK (length("Publication") <= 25),
  "Edition" VARCHAR(25) CHECK (length("Edition") <= 25),
  "Quantity" INTEGER,
  "Purchase Price" REAL,
  "Sale Price" REAL
);

CREATE TABLE IF NOT EXISTS NewOrder (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  "Book" VARCHAR(30) CHECK (length("Book") <= 30),
  "Author" VARCHAR(30) CHECK (length("Author") <= 30),
  "Publication" VARCHAR(30) CHECK (length("Publication") <= 30),
  "Quantity" INTEGER,
  "Cus Name" VARCHAR(30) CHECK (length("Cus Name") <= 30),
  "Cus Mob" VARCHAR(30) CHECK (length("Cus Mob") <= 30),
  "Cus Email" VARCHAR(30) CHECK (length("Cus Email") <= 30)
);

CREATE TABLE IF NOT EXISTS SalesDetails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  "Name" VARCHAR(30) CHECK (length("Name") <= 30),
  "Author" VARCHAR(30) CHECK (length("Author") <= 30),
  "Quantity" INTEGER,
  "Sale Price" REAL,
  "Pay" REAL
);

CREATE TABLE IF NOT EXISTS UserDetails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  "UserName" VARCHAR(30) CHECK (length("UserName") <= 30),
  "Password" TEXT
);
`;

/** Creates the tables when they do not exist yet (first start). */
export function initSchema(db: Db): void {
  db.exec(SCHEMA_SQL);
}

/** Opens a SQLite database (':memory:' allowed) and bootstraps the schema. */
export function openDatabase(file: string): Db {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new Database(file);
  if (file !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  initSchema(db);
  return db;
}

let instance: Db | null = null;

/** Shared connection, opened lazily from the DB_PATH environment variable. */
export function getDb(): Db {
  if (!instance) {
    instance = openDatabase(getDbPath());
  }
  return instance;
}

export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

/** Replaces the shared connection (used by tests). */
export function setDb(db: Db | null): void {
  instance = db;
}

// ---------------------------------------------------------------- passwords

/** scrypt hash in the form `scrypt$<salt hex>$<hash hex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const expected = Buffer.from(parts[2], 'hex');
  if (expected.length === 0) return false;
  const actual = scryptSync(password, Buffer.from(parts[1], 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// ------------------------------------------------------------------ mappers

export function toBook(r: BookRow): Book {
  return {
    id: r.id,
    name: r.Name ?? '',
    author: r.Author ?? '',
    publication: r.Publication ?? '',
    edition: r.Edition ?? '',
    quantity: r.Quantity ?? 0,
    purchasePrice: r['Purchase Price'] ?? 0,
    salePrice: r['Sale Price'] ?? 0,
  };
}

export function toCustomer(r: CustomerRow): Customer {
  return { id: r.id, name: r.Name ?? '', mobile: r.Moble ?? '', email: r.Email ?? '' };
}

export function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    book: r.Book ?? '',
    author: r.Author ?? '',
    publication: r.Publication ?? '',
    quantity: r.Quantity ?? 0,
    cusName: r['Cus Name'] ?? '',
    cusMob: r['Cus Mob'] ?? '',
    cusEmail: r['Cus Email'] ?? '',
  };
}

export function toSale(r: SaleRow): Sale {
  return {
    id: r.id,
    name: r.Name ?? '',
    author: r.Author ?? '',
    quantity: r.Quantity,
    salePrice: r['Sale Price'],
    pay: r.Pay,
  };
}

export function toUserRecord(r: UserRow): UserRecord {
  return { id: r.id, userName: r.UserName ?? '', passwordHash: r.Password ?? '' };
}
