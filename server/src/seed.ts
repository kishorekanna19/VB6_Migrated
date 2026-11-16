import fs from 'fs';
import path from 'path';
import { closeDb, getDb, hashPassword, type Db } from './db';
import { getDbPath } from './config';

export const SEED_FILE = path.resolve(__dirname, '..', 'data', 'seed.json');

type Cell = string | number | null;
type SeedRow = Record<string, Cell>;

export interface SeedData {
  NewBook: SeedRow[];
  CustomerDetails: SeedRow[];
  NewOrder: SeedRow[];
  SalesDetails: SeedRow[];
  UserDetails: SeedRow[];
}

const TABLES: Record<keyof SeedData, string[]> = {
  NewBook: ['Name', 'Author', 'Publication', 'Edition', 'Quantity', 'Purchase Price', 'Sale Price'],
  CustomerDetails: ['Name', 'Moble', 'Email'],
  NewOrder: ['Book', 'Author', 'Publication', 'Quantity', 'Cus Name', 'Cus Mob', 'Cus Email'],
  SalesDetails: ['Name', 'Author', 'Quantity', 'Sale Price', 'Pay'],
  UserDetails: ['UserName', 'Password'],
};

export function loadSeedData(file: string = SEED_FILE): SeedData {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as SeedData;
}

export interface SeedOptions {
  /** Delete existing rows of every table first (ids restart from 1). */
  reset?: boolean;
  data?: SeedData;
}

/**
 * Loads the rows exported from DB_BKShopKK.mdb. Tables that already contain
 * rows are left untouched unless `reset` is set. Passwords are stored as
 * scrypt hashes. Returns the number of rows inserted per table.
 */
export function seedDatabase(db: Db, options: SeedOptions = {}): Record<string, number> {
  const data = options.data ?? loadSeedData();
  const inserted: Record<string, number> = {};

  const run = (): void => {
    for (const table of Object.keys(TABLES) as (keyof SeedData)[]) {
      const columns = TABLES[table];
      if (options.reset) {
        db.prepare(`DELETE FROM "${table}"`).run();
        db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(table);
      } else {
        const { n } = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get() as { n: number };
        if (n > 0) {
          inserted[table] = 0;
          continue;
        }
      }
      const stmt = db.prepare(
        `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns
          .map(() => '?')
          .join(', ')})`,
      );
      const rows = data[table] ?? [];
      for (const row of rows) {
        const values = columns.map((c) => {
          const v = row[c] ?? null;
          return table === 'UserDetails' && c === 'Password' && typeof v === 'string'
            ? hashPassword(v)
            : v;
        });
        stmt.run(...values);
      }
      inserted[table] = rows.length;
    }
  };
  db.exec('BEGIN');
  try {
    run();
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return inserted;
}

function main(): void {
  const reset = process.argv.includes('--reset');
  const result = seedDatabase(getDb(), { reset });
  // eslint-disable-next-line no-console
  console.log(`Seeded ${getDbPath()}:`, result);
  closeDb();
}

if (path.basename(process.argv[1] ?? '').startsWith('seed.')) {
  main();
}
