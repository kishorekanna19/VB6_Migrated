import { getDb, toCustomer } from '../db';
import type { Customer, CustomerInput, CustomerRow } from '../types';

export function listCustomers(): Customer[] {
  const rows = getDb()
    .prepare('SELECT id, "Name", "Moble", "Email" FROM CustomerDetails ORDER BY id')
    .all() as CustomerRow[];
  return rows.map(toCustomer);
}

export function getCustomer(id: number): Customer | undefined {
  const row = getDb()
    .prepare('SELECT id, "Name", "Moble", "Email" FROM CustomerDetails WHERE id = ?')
    .get(id) as CustomerRow | undefined;
  return row ? toCustomer(row) : undefined;
}

/** frmSale.cmdPrint: saves Name, Mobile (column 'Moble') and Email. */
export function createCustomer(input: CustomerInput): Customer {
  const result = getDb()
    .prepare('INSERT INTO CustomerDetails ("Name", "Moble", "Email") VALUES (?, ?, ?)')
    .run(input.name, input.mobile, input.email);
  return getCustomer(Number(result.lastInsertRowid)) as Customer;
}

/** frmCustomerDetails.cmdDelete; returns false when the id does not exist. */
export function deleteCustomer(id: number): boolean {
  return getDb().prepare('DELETE FROM CustomerDetails WHERE id = ?').run(id).changes > 0;
}
