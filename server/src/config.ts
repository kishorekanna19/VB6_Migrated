import path from 'path';

/**
 * Runtime configuration. The VB6 application used the ODBC DSN 'DSNBKShopKK'
 * (DB_BKShopKK.mdb); here an embedded SQLite file is used and its location is
 * configurable through the DB_PATH environment variable.
 */
export const DEFAULT_DB_PATH = path.resolve(__dirname, '..', 'data', 'bookshop.sqlite');

export function getDbPath(): string {
  const fromEnv = process.env.DB_PATH;
  return fromEnv && fromEnv.trim() !== '' ? path.resolve(fromEnv) : DEFAULT_DB_PATH;
}

export function getPort(): number {
  const parsed = Number(process.env.PORT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3001;
}

/** Location of the built React client (served by Express in production). */
export const CLIENT_DIST = path.resolve(__dirname, '..', '..', 'client', 'dist');
