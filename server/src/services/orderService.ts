import { getDb, toOrder } from '../db';
import type { Order, OrderInput, OrderRow } from '../types';

const SELECT_COLUMNS =
  'id, "Book", "Author", "Publication", "Quantity", "Cus Name", "Cus Mob", "Cus Email"';

export function listOrders(): Order[] {
  const rows = getDb().prepare(`SELECT ${SELECT_COLUMNS} FROM NewOrder ORDER BY id`).all() as unknown as OrderRow[];
  return rows.map(toOrder);
}

export function getOrder(id: number): Order | undefined {
  const row = getDb().prepare(`SELECT ${SELECT_COLUMNS} FROM NewOrder WHERE id = ?`).get(id) as
    | OrderRow
    | undefined;
  return row ? toOrder(row) : undefined;
}

/** frmNewOrder.cmdSave: inserts the denormalised order row (7 fields). */
export function createOrder(input: OrderInput): Order {
  const result = getDb()
    .prepare(
      'INSERT INTO NewOrder ("Book", "Author", "Publication", "Quantity", "Cus Name", "Cus Mob", "Cus Email") VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      input.book,
      input.author,
      input.publication,
      input.quantity,
      input.cusName,
      input.cusMob,
      input.cusEmail,
    );
  return getOrder(Number(result.lastInsertRowid)) as Order;
}

/** frmOrderDetails.cmdDelete; returns false when the id does not exist. */
export function deleteOrder(id: number): boolean {
  return getDb().prepare('DELETE FROM NewOrder WHERE id = ?').run(id).changes > 0;
}
