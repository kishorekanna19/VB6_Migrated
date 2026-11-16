import { getDb, hashPassword, toUserRecord, verifyPassword } from '../db';
import type { User, UserInput, UserRecord, UserRow } from '../types';

function toUser(r: UserRecord): User {
  return { id: r.id, userName: r.userName };
}

export class DuplicateUserError extends Error {
  constructor(userName: string) {
    super(`User '${userName}' already exists`);
    this.name = 'DuplicateUserError';
  }
}

export function listUsers(): User[] {
  const rows = getDb()
    .prepare('SELECT id, "UserName", "Password" FROM UserDetails ORDER BY id')
    .all() as unknown as UserRow[];
  return rows.map((r) => toUser(toUserRecord(r)));
}

function findRecordById(id: number): UserRecord | undefined {
  const row = getDb()
    .prepare('SELECT id, "UserName", "Password" FROM UserDetails WHERE id = ?')
    .get(id) as UserRow | undefined;
  return row ? toUserRecord(row) : undefined;
}

/** User names are matched case-insensitively (as Access does). */
function findRecordByUserName(userName: string): UserRecord | undefined {
  const row = getDb()
    .prepare('SELECT id, "UserName", "Password" FROM UserDetails WHERE "UserName" = ? COLLATE NOCASE ORDER BY id')
    .get(userName) as UserRow | undefined;
  return row ? toUserRecord(row) : undefined;
}

export function getUser(id: number): User | undefined {
  const record = findRecordById(id);
  return record ? toUser(record) : undefined;
}

/** Login check: returns the user when UserName/Password match a UserDetails row. */
export function authenticate(userName: string, password: string): User | null {
  if (!userName || !password) return null;
  const record = findRecordByUserName(userName);
  if (!record || !verifyPassword(password, record.passwordHash)) return null;
  return toUser(record);
}

export function createUser(input: UserInput): User {
  if (findRecordByUserName(input.userName)) {
    throw new DuplicateUserError(input.userName);
  }
  const result = getDb()
    .prepare('INSERT INTO UserDetails ("UserName", "Password") VALUES (?, ?)')
    .run(input.userName, hashPassword(input.password));
  return getUser(Number(result.lastInsertRowid)) as User;
}

/** Updates the user name and, when given, the password. Returns undefined for an unknown id. */
export function updateUser(
  id: number,
  input: { userName: string; password?: string },
): User | undefined {
  const existing = findRecordById(id);
  if (!existing) return undefined;
  const clash = findRecordByUserName(input.userName);
  if (clash && clash.id !== id) {
    throw new DuplicateUserError(input.userName);
  }
  const passwordHash = input.password ? hashPassword(input.password) : existing.passwordHash;
  getDb()
    .prepare('UPDATE UserDetails SET "UserName" = ?, "Password" = ? WHERE id = ?')
    .run(input.userName, passwordHash, id);
  return getUser(id);
}

/** Returns false when the id does not exist. */
export function deleteUser(id: number): boolean {
  return getDb().prepare('DELETE FROM UserDetails WHERE id = ?').run(id).changes > 0;
}
