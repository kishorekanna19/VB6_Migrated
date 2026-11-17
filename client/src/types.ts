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

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
}

export interface AdminUser {
  id: number;
  userName: string;
}

export interface AuthUser {
  id?: number;
  userName: string;
}
