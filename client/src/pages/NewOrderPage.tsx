import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import DataTable, { type Column } from '../components/DataTable';
import { useEnterChain } from '../hooks/useEnterChain';
import { LIMITS, type Order, type OrderInput } from '../types';

const COLUMNS: Column<Order>[] = [
  { header: 'Book', render: (o) => o.book },
  { header: 'Author', render: (o) => o.author },
  { header: 'Publication', render: (o) => o.publication },
  { header: 'Quantity', render: (o) => o.quantity, align: 'right' },
  { header: 'Customer Name', render: (o) => o.cusName },
  { header: 'Mobile', render: (o) => o.cusMob },
  { header: 'Email', render: (o) => o.cusEmail },
];

const EMPTY = {
  custName: '',
  custMob: '',
  custEmail: '',
  book: '',
  author: '',
  publication: '',
  quantity: '',
};

type Field = keyof typeof EMPTY;

/** frmNewOrder: take an order (customer + book details) and list the saved orders. */
export default function NewOrderPage() {
  const navigate = useNavigate();
  const { showMessage, dialog } = useMessageBox();
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLInputElement>(null);
  const onKeyDown = useEnterChain();

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

  const set = (field: Field) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const clearAll = () => {
    setForm(EMPTY);
    nameRef.current?.focus();
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
    const body: OrderInput = {
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
      await api.post<Order>('/orders', body);
      await load();
      await showMessage('Record saved.', 'Information');
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
      <h3>New Order</h3>
      <form className="book-form" onSubmit={onSubmit} onKeyDown={onKeyDown}>
        <fieldset>
          <legend>Customer &amp; Book Details</legend>
          <label>
            Customer name
            <input
              ref={nameRef}
              type="text"
              autoFocus
              value={form.custName}
              maxLength={LIMITS.order.cusName}
              onChange={set('custName')}
            />
          </label>
          <label>
            Mobile
            <input type="text" value={form.custMob} maxLength={LIMITS.order.cusMob} onChange={set('custMob')} />
          </label>
          <label>
            Email
            <input type="text" value={form.custEmail} maxLength={LIMITS.order.cusEmail} onChange={set('custEmail')} />
          </label>
          <label>
            Book
            <input ref={bookRef} type="text" value={form.book} maxLength={LIMITS.order.book} onChange={set('book')} />
          </label>
          <label>
            Author
            <input type="text" value={form.author} maxLength={LIMITS.order.author} onChange={set('author')} />
          </label>
          <label>
            Publication
            <input
              type="text"
              value={form.publication}
              maxLength={LIMITS.order.publication}
              onChange={set('publication')}
            />
          </label>
          <label>
            Quantity
            <input type="number" step="1" value={form.quantity} onChange={set('quantity')} />
          </label>
        </fieldset>
        <div className="form-buttons">
          <button type="button" disabled={busy} onClick={() => void save()}>
            Save
          </button>
          <button type="button" onClick={clearAll}>
            Clear
          </button>
          <button type="button" onClick={clearAll}>
            New
          </button>
          <button type="button" onClick={() => navigate('/home')}>
            Exit
          </button>
        </div>
      </form>
      <DataTable columns={COLUMNS} rows={orders} rowKey={(o) => o.id} emptyText="No orders found" />
      {dialog}
    </div>
  );
}
