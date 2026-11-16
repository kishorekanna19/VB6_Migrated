import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import { useEnterChain } from '../hooks/useEnterChain';
import { LIMITS, type Book, type BookInput } from '../types';

interface FormState {
  name: string;
  author: string;
  publication: string;
  edition: string;
  quantity: string;
  purchasePrice: string;
  salePrice: string;
}

const EMPTY: FormState = {
  name: '',
  author: '',
  publication: '',
  edition: '',
  quantity: '',
  purchasePrice: '',
  salePrice: '',
};

function toForm(book: Book | undefined): FormState {
  if (!book) return EMPTY;
  return {
    name: book.name,
    author: book.author,
    publication: book.publication,
    edition: book.edition,
    quantity: String(book.quantity),
    purchasePrice: String(book.purchasePrice),
    salePrice: String(book.salePrice),
  };
}

function toNumber(text: string): number {
  return text.trim() === '' ? 0 : Number(text);
}

/** frmEditBookDetails: browse the books with Prev/Next, update or delete the shown one. */
export default function EditBookPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useMessageBox();
  const [books, setBooks] = useState<Book[]>([]);
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const onKeyDown = useEnterChain();

  const current: Book | undefined = books[index];

  const show = useCallback((list: Book[], i: number) => {
    setBooks(list);
    setIndex(i);
    setForm(toForm(list[i]));
  }, []);

  const load = useCallback(
    async (keepIndex: number) => {
      try {
        const list = await api.get<Book[]>('/books');
        show(list, Math.max(0, Math.min(keepIndex, list.length - 1)));
      } catch (err) {
        await showMessage(errorMessage(err));
      }
    },
    [show, showMessage],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  const set = (field: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const prev = async () => {
    if (index <= 0) {
      await showMessage('You reached at first data');
      return;
    }
    show(books, index - 1);
  };

  const next = async () => {
    if (index >= books.length - 1) {
      await showMessage('You reached at last data');
      return;
    }
    show(books, index + 1);
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
      await api.put<Book>(`/books/${current.id}`, body);
      await load(index);
      await showMessage('Details Updated.');
    } catch (err) {
      await showMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!current) return;
    if (!(await confirm('Do you want delete.'))) return;
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
  };

  return (
    <div className="book-page">
      <h3>Update Book Details</h3>
      <form className="book-form" onSubmit={(e) => e.preventDefault()} onKeyDown={onKeyDown}>
        <label>
          Book name
          <input type="text" value={form.name} maxLength={LIMITS.book.name} onChange={set('name')} />
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
          <button type="button" onClick={() => void prev()}>
            Previous
          </button>
          <button type="button" onClick={() => void next()}>
            Next
          </button>
          <button type="button" disabled={busy || !current} onClick={() => void update()}>
            Update
          </button>
          <button type="button" disabled={busy || !current} onClick={() => void remove()}>
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
