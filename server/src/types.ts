/**
 * Shared domain types (mirrored in client/src/types.ts).
 *
 * The SQLite tables keep the original Access column names (including the
 * 'Moble' typo and the names with spaces); the API uses camelCase properties.
 * Every row additionally has an integer autoincrement `id` (the Access tables
 * had no primary key; ADODC edited the "current record").
 */

export interface Book {
  id: number;
  name: string;
  author: string;
  publication: string;
  edition: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface Customer {
  id: number;
  name: string;
  /** Column 'Moble' in the source database. */
  mobile: string;
  email: string;
}

export interface Order {
  id: number;
  book: string;
  author: string;
  publication: string;
  quantity: number;
  cusName: string;
  cusMob: string;
  cusEmail: string;
}

/** Quantity, price and pay can be empty in the source data. */
export interface Sale {
  id: number;
  name: string;
  author: string;
  quantity: number | null;
  salePrice: number | null;
  pay: number | null;
}

/** User as exposed to clients (never includes the password). */
export interface User {
  id: number;
  userName: string;
}

/** Server-side only: user including the scrypt password hash. */
export interface UserRecord extends User {
  passwordHash: string;
}

export type BookInput = Omit<Book, 'id'>;
export type CustomerInput = Omit<Customer, 'id'>;
export type OrderInput = Omit<Order, 'id'>;
export type SaleInput = Omit<Sale, 'id'>;

export interface UserInput {
  userName: string;
  password: string;
}

/** Raw SQLite rows (source column names). */
export interface BookRow {
  id: number;
  Name: string | null;
  Author: string | null;
  Publication: string | null;
  Edition: string | null;
  Quantity: number | null;
  'Purchase Price': number | null;
  'Sale Price': number | null;
}

export interface CustomerRow {
  id: number;
  Name: string | null;
  Moble: string | null;
  Email: string | null;
}

export interface OrderRow {
  id: number;
  Book: string | null;
  Author: string | null;
  Publication: string | null;
  Quantity: number | null;
  'Cus Name': string | null;
  'Cus Mob': string | null;
  'Cus Email': string | null;
}

export interface SaleRow {
  id: number;
  Name: string | null;
  Author: string | null;
  Quantity: number | null;
  'Sale Price': number | null;
  Pay: number | null;
}

export interface UserRow {
  id: number;
  UserName: string | null;
  Password: string | null;
}
