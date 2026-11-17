import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage, FIELD_LIMITS } from '../api';
import { useDialog } from '../components/DialogProvider';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import type { Order } from '../types';

const columns: Column<Order>[] = [
  { header: 'Book', render: (o) => o.book },
  { header: 'Author', render: (o) => o.author },
  { header: 'Publication', render: (o) => o.publication },
  { header: 'Quantity', render: (o) => o.quantity, align: 'right' },
  { header: 'Customer Name', render: (o) => o.cusName },
  { header: 'Mobile', render: (o) => o.cusMob },
  { header: 'Email', render: (o) => o.cusEmail },
];

interface OrderForm {
  custName: string;
  custMob: string;
  custEmail: string;
  book: string;
  author: string;
  publication: string;
  quantity: string;
}

const EMPTY: OrderForm = {
  custName: '',
  custMob: '',
  custEmail: '',
  book: '',
  author: '',
  publication: '',
  quantity: '',
};

export default function NewOrderPage() {
  const navigate = useNavigate();
  const { showMessage, dialog } = useDialog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<OrderForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const custNameRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLInputElement>(null);
  const onKeyDown = useEnterAsTab();

  const load = useCallback(async () => {
    try {
      setOrders(await api.get<Order[]>('/orders'));
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  }, [showMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const change = (key: keyof OrderForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const clear = () => {
    setForm(EMPTY);
    custNameRef.current?.focus();
  };

  const save = async () => {
    if (form.book.trim() === '') {
      await showMessage('Please enter the book name');
      bookRef.current?.focus();
      return;
    }
    const quantity = form.quantity.trim() === '' ? 0 : Number(form.quantity);
    if (!Number.isInteger(quantity)) {
      await showMessage('Please enter a valid quantity');
      return;
    }
    const payload = {
      book: form.book.trim(),
      author: form.author,
      publication: form.publication,
      quantity,
      cusName: form.custName,
      cusMob: form.custMob,
      cusEmail: form.custEmail,
    };
    setBusy(true);
    try {
      await api.post('/orders', payload);
      await load();
      await showMessage('Record saved.', 'Information');
    } catch (err) {
      await showMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="book-page">
      <h3>New Order</h3>
      <form
        className="book-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        onKeyDown={onKeyDown}
      >
        <fieldset>
          <legend>Customer &amp; Book Details</legend>
          <label>
            Customer name
            <input
              ref={custNameRef}
              type="text"
              autoFocus
              value={form.custName}
              maxLength={FIELD_LIMITS.order.cusName}
              onChange={change('custName')}
            />
          </label>
          <label>
            Mobile
            <input
              type="text"
              value={form.custMob}
              maxLength={FIELD_LIMITS.order.cusMob}
              onChange={change('custMob')}
            />
          </label>
          <label>
            Email
            <input
              type="text"
              value={form.custEmail}
              maxLength={FIELD_LIMITS.order.cusEmail}
              onChange={change('custEmail')}
            />
          </label>
          <label>
            Book
            <input
              ref={bookRef}
              type="text"
              value={form.book}
              maxLength={FIELD_LIMITS.order.book}
              onChange={change('book')}
            />
          </label>
          <label>
            Author
            <input
              type="text"
              value={form.author}
              maxLength={FIELD_LIMITS.order.author}
              onChange={change('author')}
            />
          </label>
          <label>
            Publication
            <input
              type="text"
              value={form.publication}
              maxLength={FIELD_LIMITS.order.publication}
              onChange={change('publication')}
            />
          </label>
          <label>
            Quantity
            <input type="number" step="1" value={form.quantity} onChange={change('quantity')} />
          </label>
        </fieldset>
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
          <button type="button" onClick={() => navigate('/home')}>
            Exit
          </button>
        </div>
      </form>
      <DataTable columns={columns} rows={orders} rowKey={(o) => o.id} emptyText="No orders found" />
      {dialog}
    </div>
  );
}
