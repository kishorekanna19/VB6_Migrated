import { Router, type Response } from 'express';
import { bookSchema, idSchema, validate } from '../validation';
import { createBook, deleteBook, getBook, listBooks, updateBook } from '../services/bookService';

const router = Router();

function parseId(raw: string, res: Response): number | null {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid book id' });
    return null;
  }
  return parsed.data;
}

// List all books, or exact-name matches with ?name=
router.get('/', (req, res) => {
  const rawName = req.query.name;
  if (rawName !== undefined && typeof rawName !== 'string') {
    res.status(400).json({ error: 'name must be a single string' });
    return;
  }
  res.json(listBooks(rawName));
});

router.get('/:id', (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;
  const book = getBook(id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json(book);
});

router.post('/', (req, res) => {
  const result = validate(bookSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.status(201).json(createBook(result.data));
});

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;
  const result = validate(bookSchema, req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  const book = updateBook(id, result.data);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json(book);
});

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === null) return;
  if (!deleteBook(id)) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.status(204).end();
});

export default router;
