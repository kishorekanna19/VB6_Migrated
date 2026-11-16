import { z } from 'zod';

/**
 * Validators enforcing the column sizes of the original Access tables.
 * Access 'Integer' is a 16-bit value, 'Double' a floating point number.
 */
export const LIMITS = {
  customer: { name: 30, mobile: 15, email: 30 },
  book: { name: 25, author: 25, publication: 25, edition: 25 },
  order: { book: 30, author: 30, publication: 30, cusName: 30, cusMob: 30, cusEmail: 30 },
  sale: { name: 30, author: 30 },
  user: { userName: 30, password: 30 },
} as const;

export const INT_MIN = -32768;
export const INT_MAX = 32767;

const text = (max: number) => z.string().max(max, `Must be at most ${max} characters`);
const requiredText = (max: number) =>
  text(max).refine((v) => v.trim().length > 0, { message: 'Required' });
const integer = z.number().int().min(INT_MIN).max(INT_MAX);
const money = z.number().finite();

export const customerSchema = z.object({
  name: requiredText(LIMITS.customer.name),
  mobile: text(LIMITS.customer.mobile),
  email: text(LIMITS.customer.email),
});

export const bookSchema = z.object({
  name: requiredText(LIMITS.book.name),
  author: text(LIMITS.book.author),
  publication: text(LIMITS.book.publication),
  edition: text(LIMITS.book.edition),
  quantity: integer,
  purchasePrice: money,
  salePrice: money,
});

export const orderSchema = z.object({
  book: requiredText(LIMITS.order.book),
  author: text(LIMITS.order.author),
  publication: text(LIMITS.order.publication),
  quantity: integer,
  cusName: text(LIMITS.order.cusName),
  cusMob: text(LIMITS.order.cusMob),
  cusEmail: text(LIMITS.order.cusEmail),
});

export const saleSchema = z.object({
  name: requiredText(LIMITS.sale.name),
  author: text(LIMITS.sale.author),
  quantity: integer.nullable(),
  salePrice: money.nullable(),
  pay: money.nullable(),
});

export const userSchema = z.object({
  userName: requiredText(LIMITS.user.userName),
  password: text(LIMITS.user.password).min(1, 'Required'),
});

export const loginSchema = z.object({
  userName: text(LIMITS.user.userName),
  password: text(LIMITS.user.password),
});

export const idSchema = z.coerce.number().int().positive();

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Parses `input` with `schema` and returns a flat, human readable error message on failure. */
export function validate<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const error = result.error.issues
    .map((issue) => {
      const field = issue.path.join('.');
      return field ? `${field}: ${issue.message}` : issue.message;
    })
    .join('; ');
  return { ok: false, error };
}
