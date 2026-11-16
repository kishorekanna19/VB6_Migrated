import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import DataTable, { type Column } from '../components/DataTable';
import { useEnterChain } from '../hooks/useEnterChain';
import { LIMITS, type Book, type BookInput } from '../types';

const COLUMNS: Column<Book>[] = [
  { header: 'Book Name', render: (b) => b.name },
  { header: 'Author', render: (b) => b.author },
  { header: 'Publication', render: (b) => b.publication },
  { header: 'Edition', render: (b) => b.edition },
  { header: 'Quantity', render: (b) => b.quantity, align: 'right' },
  { header: 'Purchase Price', render: (b) => b.purchasePrice, align: 'right' },
  { header: 'Sale Price', render: (b) => b.salePrice, align: 'right' },
];

const EMPTY = {
  name: '',
  author: '',
  publication: '',
  edition: '',
  quantity: '',
  purchasePrice: '',
  salePrice: '',
};

function toNumber(text: string): number {
  return text.trim() === '' ? 0 : Number(text);
}

/** AddNewBook: enter a new book (7 fields) and list the books already saved. */
export default function NewBookPage() {
  const { showMessage, dialog } = useMessageBox();
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const onKeyDown = useEnterChain();

  const load = useCallback(async () => {
    try {
      setBooks(await api.get<Book[]>('/books'));
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  }, [showMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const clear = () => {
    setForm(EMPTY);
    nameRef.current?.focus();
  };

  const save = async () => {
    if (form.name.trim() === '') {
      await showMessage('Please enter the book name');
      nameRef.current?.focus();
      return;
    }
    const quantity = toNumber(form.quantity);
    if (!Number.isInteger(quantity)) {
      await showMessage('Please enter a valid quantity');
      return;
    }
    const purchasePrice = toNumber(form.purchasePrice);
    if (!Number.isFinite(purchasePrice)) {
      await showMessage('Please enter a valid purchase price');
      return;
    }
    const salePrice = toNumber(form.salePrice);
    if (!Number.isFinite(salePrice)) {
      await showMessage('Please enter a valid sale price');
      return;
    }
    const body: BookInput = {
      name: form.name.trim(),
      author: form.author,
      publication: form.publication,
      edition: form.edition,
      quantity,
      purchasePrice,
      salePrice,
    };
    setBusy(true);
    try {
      await api.post<Book>('/books', body);
      clear();
      await load();
      await showMessage('Record saved.');
    } catch (err) {
      await showMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void save();
  };

  return (
    <div className="book-page">
      <h3>New Book</h3>
      <form className="book-form" onSubmit={onSubmit} onKeyDown={onKeyDown}>
        <label>
          Book name
          <input ref={nameRef} type="text" autoFocus value={form.name} maxLength={LIMITS.book.name} onChange={set('name')} />
        </label>
        <label>
          Author
          <input type="text" value={form.author} maxLength={LIMITS.book.author} onChange={set('author')} />
        </label>
        <label>
          Publication
          <input
            type="text"
            value={form.publication}
            maxLength={LIMITS.book.publication}
            onChange={set('publication')}
          />
        </label>
        <label>
          Edition
          <input type="text" value={form.edition} maxLength={LIMITS.book.edition} onChange={set('edition')} />
        </label>
        <label>
          Quantity
          <input type="number" step="1" value={form.quantity} onChange={set('quantity')} />
        </label>
        <label>
          Purchase Price
          <input type="number" step="any" value={form.purchasePrice} onChange={set('purchasePrice')} />
        </label>
        <label>
          Sale Price
          <input type="number" step="any" value={form.salePrice} onChange={set('salePrice')} />
        </label>
        <div className="form-buttons">
          <button type="button" disabled={busy} onClick={() => void save()}>
            Save
          </button>
          <button type="button" onClick={clear}>
            Clear
          </button>
          <button type="button" onClick={clear}>
            New
          </button>
        </div>
      </form>
      <DataTable columns={COLUMNS} rows={books} rowKey={(b) => b.id} emptyText="No books found" />
      {dialog}
    </div>
  );
}
