import { useRef, useState } from 'react';
import { api, errorMessage } from '../api';
import { useDialog } from '../components/DialogProvider';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { useEnterAsTab } from '../hooks/useEnterAsTab';

interface SaleItem {
  key: number;
  name: string;
  author: string;
  quantity: string;
  salePrice: string;
  totalPay: number;
}

const columns: Column<SaleItem>[] = [
  { header: 'Book Name', render: (i) => i.name },
  { header: 'Author', render: (i) => i.author },
  { header: 'Quantity', render: (i) => i.quantity, align: 'right' },
  { header: 'Sale Price', render: (i) => i.salePrice, align: 'right' },
  { header: 'Total Pay', render: (i) => i.totalPay, align: 'right' },
];

interface SaleForm {
  custName: string;
  custMob: string;
  custEmail: string;
  book: string;
  author: string;
  quantity: string;
  salePrice: string;
  pay: string;
}

const EMPTY: SaleForm = {
  custName: '',
  custMob: '',
  custEmail: '',
  book: '',
  author: '',
  quantity: '',
  salePrice: '',
  pay: '',
};

/** VB6 Val(): leading numeric prefix of the string (spaces ignored), 0 when none. */
const VAL_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eEdD][+-]?\d+)?/;

function val(text: string): number {
  const match = VAL_PATTERN.exec(text.replace(/\s+/g, ''));
  if (!match) return 0;
  const n = Number(match[0].replace(/[dD]/, 'e'));
  return Number.isFinite(n) ? n : 0;
}

function lineTotal(quantity: string, price: string): number {
  const n = val(quantity) * val(price);
  return Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : 0;
}

export default function SalePage() {
  const { showMessage, dialog } = useDialog();
  const [form, setForm] = useState<SaleForm>(EMPTY);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [busy, setBusy] = useState(false);
  const nextKey = useRef(1);
  const custNameRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLInputElement>(null);
  const salePriceRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLInputElement>(null);
  const enterAsTab = useEnterAsTab();
  const total = items.reduce((sum, i) => sum + i.totalPay, 0);

  const change = (key: keyof SaleForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && e.target === salePriceRef.current) {
      e.preventDefault();
      const pay = String(lineTotal(form.quantity, form.salePrice));
      setForm((f) => ({ ...f, pay }));
      payRef.current?.focus();
    } else {
      enterAsTab(e);
    }
  };

  const clearLine = () => {
    setForm((f) => ({ ...f, book: '', author: '', quantity: '', salePrice: '', pay: '' }));
  };

  const clearAll = () => {
    setForm(EMPTY);
    setItems([]);
    custNameRef.current?.focus();
  };

  const add = async () => {
    if (form.book.trim() === '') {
      await showMessage('Please enter the book name');
      bookRef.current?.focus();
      return;
    }
    const totalPay = form.pay.trim() === '' ? lineTotal(form.quantity, form.salePrice) : val(form.pay);
    const item: SaleItem = {
      key: nextKey.current++,
      name: form.book.trim(),
      author: form.author,
      quantity: form.quantity,
      salePrice: form.salePrice,
      totalPay,
    };
    setItems((list) => [...list, item]);
    clearLine();
    bookRef.current?.focus();
  };

  const print = async () => {
    if (form.custName.trim() === '') {
      await showMessage('Please enter the customer name');
      custNameRef.current?.focus();
      return;
    }
    const customer = { name: form.custName.trim(), mobile: form.custMob, email: form.custEmail };
    setBusy(true);
    try {
      await api.post('/customers', customer);
      for (const item of items) {
        await api.post('/sales', {
          name: item.name,
          author: item.author,
          quantity: item.quantity,
          salePrice: item.salePrice,
        });
      }
      window.print();
      clearAll();
    } catch (err) {
      await showMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="book-page sale-page">
      <h3>Sale Book&apos;s</h3>
      <form className="book-form" onSubmit={(e) => e.preventDefault()} onKeyDown={onKeyDown}>
        <fieldset>
          <legend>Customer &amp; Book Details</legend>
          <label>
            Customer name
            <input
              ref={custNameRef}
              type="text"
              autoFocus
              value={form.custName}
              maxLength={30}
              onChange={change('custName')}
            />
          </label>
          <label>
            Mobile
            <input type="text" value={form.custMob} maxLength={15} onChange={change('custMob')} />
          </label>
          <label>
            Email
            <input type="text" value={form.custEmail} maxLength={30} onChange={change('custEmail')} />
          </label>
          <label>
            Book
            <input ref={bookRef} type="text" value={form.book} maxLength={30} onChange={change('book')} />
          </label>
          <label>
            Author
            <input type="text" value={form.author} maxLength={30} onChange={change('author')} />
          </label>
          <label>
            Quantity
            <input
              type="text"
              inputMode="numeric"
              value={form.quantity}
              maxLength={30}
              onChange={change('quantity')}
            />
          </label>
          <label>
            Sale Price
            <input
              ref={salePriceRef}
              type="text"
              inputMode="decimal"
              value={form.salePrice}
              maxLength={30}
              onChange={change('salePrice')}
            />
          </label>
          <label>
            Pay
            <input
              ref={payRef}
              type="text"
              inputMode="decimal"
              value={form.pay}
              maxLength={30}
              onChange={change('pay')}
            />
          </label>
        </fieldset>
        <div className="form-buttons">
          <button type="button" className="btn-primary" onClick={() => void add()}>
            Add
          </button>
          <button type="button" onClick={clearAll}>
            Clear
          </button>
          <button type="button" aria-busy={busy || undefined} disabled={busy} onClick={() => void print()}>
            Print
          </button>
        </div>
      </form>
      <h4>Book Details</h4>
      <DataTable columns={columns} rows={items} rowKey={(i) => i.key} emptyText="No books added" />
      <div className="sale-total" role="status" aria-live="polite">
        <span className="sale-total-label">Total :</span>{' '}
        <span className="sale-total-value" data-testid="sale-total">
          {total.toFixed(2)}
        </span>
      </div>
      {dialog}
    </div>
  );
}
