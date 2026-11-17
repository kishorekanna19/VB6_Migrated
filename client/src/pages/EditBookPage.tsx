import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage, FIELD_LIMITS } from '../api';
import { useDialog } from '../components/DialogProvider';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import type { Book } from '../types';

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

function toForm(book: Book | undefined): BookForm {
  return book
    ? {
        name: book.name,
        author: book.author,
        publication: book.publication,
        edition: book.edition,
        quantity: String(book.quantity),
        purchasePrice: String(book.purchasePrice),
        salePrice: String(book.salePrice),
      }
    : EMPTY;
}

function toNumber(value: string): number {
  return value.trim() === '' ? 0 : Number(value);
}

export default function EditBookPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState<BookForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const onKeyDown = useEnterAsTab();
  const current: Book | undefined = books[index];

  const show = useCallback((list: Book[], i: number) => {
    setBooks(list);
    setIndex(i);
    setForm(toForm(list[i]));
  }, []);

  const load = useCallback(
    async (at: number) => {
      try {
        const list = await api.get<Book[]>('/books');
        show(list, Math.max(0, Math.min(at, list.length - 1)));
      } catch (err) {
        await showMessage(errorMessage(err));
      }
    },
    [show, showMessage],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  const change = (key: keyof BookForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const previous = async () => {
    if (index <= 0) {
      await showMessage('You reached at first data');
    } else {
      show(books, index - 1);
    }
  };

  const next = async () => {
    if (index >= books.length - 1) {
      await showMessage('You reached at last data');
    } else {
      show(books, index + 1);
    }
  };

  const update = async () => {
    if (!current) return;
    if (form.name.trim() === '') {
      await showMessage('Please enter the book name');
      return;
    }
    const quantity = toNumber(form.quantity);
    const purchasePrice = toNumber(form.purchasePrice);
    const salePrice = toNumber(form.salePrice);
    if (!Number.isInteger(quantity)) {
      await showMessage('Please enter a valid quantity');
      return;
    }
    if (!Number.isFinite(purchasePrice) || !Number.isFinite(salePrice)) {
      await showMessage('Please enter a valid price');
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
      await api.put(`/books/${current.id}`, payload);
      await load(index);
      await showMessage('Details Updated.');
    } catch (err) {
      await showMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (current && (await confirm('Do you want delete.'))) {
      setBusy(true);
      try {
        await api.del(`/books/${current.id}`);
        await load(index);
        await showMessage('record deleted.');
      } catch (err) {
        await showMessage(errorMessage(err));
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="book-page">
      <h3>Update Book Details</h3>
      <form className="book-form" onSubmit={(e) => e.preventDefault()} onKeyDown={onKeyDown}>
        <label>
          Book name
          <input type="text" value={form.name} maxLength={FIELD_LIMITS.book.name} onChange={change('name')} />
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
          <button type="button" onClick={() => void previous()}>
            Previous
          </button>
          <button type="button" onClick={() => void next()}>
            Next
          </button>
          <button
            type="button"
            className="btn-primary"
            aria-busy={busy || undefined}
            disabled={busy || !current}
            onClick={() => void update()}
          >
            Update
          </button>
          <button type="button" className="btn-danger" disabled={busy || !current} onClick={() => void remove()}>
            Delete
          </button>
          <button type="button" onClick={() => navigate('/home')}>
            Exit
          </button>
        </div>
      </form>
      {dialog}
    </div>
  );
}
