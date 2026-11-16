/** Mirror of server/src/types.ts (API shapes). Passwords are never returned by the API. */

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

export interface Sale {
  id: number;
  name: string;
  author: string;
  quantity: number | null;
  salePrice: number | null;
  pay: number | null;
}

export interface User {
  id: number;
  userName: string;
}

export type BookInput = Omit<Book, 'id'>;
export type CustomerInput = Omit<Customer, 'id'>;
export type OrderInput = Omit<Order, 'id'>;
export type SaleInput = Omit<Sale, 'id'>;

export interface UserInput {
  userName: string;
  password: string;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface ApiError {
  error: string;
}

/** Source column size limits (Access text field sizes). */
export const LIMITS = {
  customer: { name: 30, mobile: 15, email: 30 },
  book: { name: 25, author: 25, publication: 25, edition: 25 },
  order: { book: 30, author: 30, publication: 30, cusName: 30, cusMob: 30, cusEmail: 30 },
  sale: { name: 30, author: 30 },
  user: { userName: 30, password: 30 },
} as const;
