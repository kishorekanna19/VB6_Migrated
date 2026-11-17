import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage, FIELD_LIMITS } from '../api';
import { useDialog } from '../components/DialogProvider';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import type { Book } from '../types';

const columns: Column<Book>[] = [
  { header: 'Book Name', render: (b) => b.name },
  { header: 'Author', render: (b) => b.author },
  { header: 'Publication', render: (b) => b.publication },
  { header: 'Edition', render: (b) => b.edition },
  { header: 'Quantity', render: (b) => b.quantity, align: 'right' },
  { header: 'Purchase Price', render: (b) => b.purchasePrice, align: 'right' },
  { header: 'Sale Price', render: (b) => b.salePrice, align: 'right' },
];

interface BookForm {
  name: string;
  author: string;
  publication: string;
  edition: string;
  quantity: string;
  purchasePrice: string;
  salePrice: string;
}

const EMPTY: BookForm = {
  name: '',
  author: '',
  publication: '',
  edition: '',
  quantity: '',
  purchasePrice: '',
  salePrice: '',
};

function toNumber(value: string): number {
  return value.trim() === '' ? 0 : Number(value);
}

export default function NewBookPage() {
  const { showMessage, dialog } = useDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<BookForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const onKeyDown = useEnterAsTab();

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

  const change = (key: keyof BookForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
    const payload = {
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
      await api.post('/books', payload);
      clear();
      await load();
      await showMessage('Record saved.');
    } catch (err) {
      await showMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="book-page">
      <h3>New Book</h3>
      <form
        className="book-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        onKeyDown={onKeyDown}
      >
        <label>
          Book name
          <input
            ref={nameRef}
            type="text"
            autoFocus
            value={form.name}
            maxLength={FIELD_LIMITS.book.name}
            onChange={change('name')}
          />
        </label>
        <label>
          Author
          <input type="text" value={form.author} maxLength={FIELD_LIMITS.book.author} onChange={change('author')} />
        </label>
        <label>
          Publication
          <input
            type="text"
            value={form.publication}
            maxLength={FIELD_LIMITS.book.publication}
            onChange={change('publication')}
          />
        </label>
        <label>
          Edition
          <input type="text" value={form.edition} maxLength={FIELD_LIMITS.book.edition} onChange={change('edition')} />
        </label>
        <label>
          Quantity
          <input type="number" step="1" value={form.quantity} onChange={change('quantity')} />
        </label>
        <label>
          Purchase Price
          <input type="number" step="any" value={form.purchasePrice} onChange={change('purchasePrice')} />
        </label>
        <label>
          Sale Price
          <input type="number" step="any" value={form.salePrice} onChange={change('salePrice')} />
        </label>
        <div className="form-buttons">
          <button
            type="button"
            className="btn-primary"
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={() => void save()}
          >
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
      <DataTable columns={columns} rows={books} rowKey={(b) => b.id} emptyText="No books found" />
      {dialog}
    </div>
  );
}
