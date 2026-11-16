import { getDb, toBook } from '../db';
import type { Book, BookInput, BookRow } from '../types';

const SELECT_COLUMNS =
  'id, "Name", "Author", "Publication", "Edition", "Quantity", "Purchase Price", "Sale Price"';

/**
 * Lists books in insertion order. When `name` is a non-empty string only the books whose
 * Name equals it exactly are returned (parameterised query; the VB6 original concatenated
 * the search text into the SQL). An empty/missing name returns every book.
 */
export function listBooks(name?: string): Book[] {
  const db = getDb();
  const rows =
    name === undefined || name === ''
      ? (db.prepare(`SELECT ${SELECT_COLUMNS} FROM NewBook ORDER BY id`).all() as unknown as BookRow[])
      : (db
          .prepare(`SELECT ${SELECT_COLUMNS} FROM NewBook WHERE "Name" = ? ORDER BY id`)
          .all(name) as unknown as BookRow[]);
  return rows.map(toBook);
}

export function getBook(id: number): Book | undefined {
  const row = getDb().prepare(`SELECT ${SELECT_COLUMNS} FROM NewBook WHERE id = ?`).get(id) as
    | BookRow
    | undefined;
  return row ? toBook(row) : undefined;
}

export function createBook(input: BookInput): Book {
  const db = getDb();
  const result = db
    .prepare(
      'INSERT INTO NewBook ("Name", "Author", "Publication", "Edition", "Quantity", "Purchase Price", "Sale Price") VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      input.name,
      input.author,
      input.publication,
      input.edition,
      input.quantity,
      input.purchasePrice,
      input.salePrice,
    );
  return getBook(Number(result.lastInsertRowid)) as Book;
}

/** Updates all 7 fields of the book; returns undefined when the id does not exist. */
export function updateBook(id: number, input: BookInput): Book | undefined {
  const result = getDb()
    .prepare(
      'UPDATE NewBook SET "Name" = ?, "Author" = ?, "Publication" = ?, "Edition" = ?, "Quantity" = ?, "Purchase Price" = ?, "Sale Price" = ? WHERE id = ?',
    )
    .run(
      input.name,
      input.author,
      input.publication,
      input.edition,
      input.quantity,
      input.purchasePrice,
      input.salePrice,
      id,
    );
  if (result.changes === 0) return undefined;
  return getBook(id);
}

/** Deletes the book; returns false when the id does not exist. */
export function deleteBook(id: number): boolean {
  const result = getDb().prepare('DELETE FROM NewBook WHERE id = ?').run(id);
  return result.changes > 0;
}
