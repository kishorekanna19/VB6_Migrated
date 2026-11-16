import { useRef, useState, type KeyboardEvent } from 'react';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import DataTable, { type Column } from '../components/DataTable';
import { useEnterChain } from '../hooks/useEnterChain';
import type { CustomerInput } from '../types';

interface SaleLine {
  key: number;
  name: string;
  author: string;
  quantity: string;
  salePrice: string;
  totalPay: number;
}

const COLUMNS: Column<SaleLine>[] = [
  { header: 'Book Name', render: (l) => l.name },
  { header: 'Author', render: (l) => l.author },
  { header: 'Quantity', render: (l) => l.quantity, align: 'right' },
  { header: 'Sale Price', render: (l) => l.salePrice, align: 'right' },
  { header: 'Total Pay', render: (l) => l.totalPay, align: 'right' },
];

const EMPTY = {
  custName: '',
  custMob: '',
  custEmail: '',
  book: '',
  author: '',
  quantity: '',
  salePrice: '',
  pay: '',
};

type Field = keyof typeof EMPTY;

const NUMBER_PREFIX = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eEdD][+-]?\d+)?/;

/** VB6 Val(): leading numeric part of the text, 0 when there is none. */
function vbVal(text: string): number {
  const match = NUMBER_PREFIX.exec(text.replace(/\s+/g, ''));
  if (!match) return 0;
  const parsed = Number(match[0].replace(/[dD]/, 'e'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Pay = Val(quantity * salePrice), rounded to remove floating point noise. */
function computePay(quantity: string, salePrice: string): number {
  const total = vbVal(quantity) * vbVal(salePrice);
  return Number.isFinite(total) ? Math.round(total * 1e6) / 1e6 : 0;
}

/** frmSale: build a bill line by line, then Print saves the customer and the lines. */
export default function SalePage() {
  const { showMessage, dialog } = useMessageBox();
  const [form, setForm] = useState(EMPTY);
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [busy, setBusy] = useState(false);
  const nextKey = useRef(1);
  const nameRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLInputElement>(null);
  const salePriceRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLInputElement>(null);
  const chain = useEnterChain();

  const total = lines.reduce((sum, l) => sum + l.totalPay, 0);

  const set = (field: Field) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && e.target === salePriceRef.current) {
      // txtPay.Text = Val(txtQuantity.Text * txtSalePrice.Text): txtPay.SetFocus
      e.preventDefault();
      const pay = String(computePay(form.quantity, form.salePrice));
      setForm((prev) => ({ ...prev, pay }));
      const payInput = payRef.current;
      payInput?.focus();
      return;
    }
    chain(e);
  };

  const clearLineFields = () => {
    setForm((prev) => ({ ...prev, book: '', author: '', quantity: '', salePrice: '', pay: '' }));
  };

  const clearAll = () => {
    setForm(EMPTY);
    setLines([]);
    nameRef.current?.focus();
  };

  const add = async () => {
    if (form.book.trim() === '') {
      await showMessage('Please enter the book name');
      bookRef.current?.focus();
      return;
    }
    const totalPay = form.pay.trim() === '' ? computePay(form.quantity, form.salePrice) : vbVal(form.pay);
    const line: SaleLine = {
      key: nextKey.current++,
      name: form.book.trim(),
      author: form.author,
      quantity: form.quantity,
      salePrice: form.salePrice,
      totalPay,
    };
    setLines((prev) => [...prev, line]);
    clearLineFields();
    bookRef.current?.focus();
  };

  const print = async () => {
    if (form.custName.trim() === '') {
      await showMessage('Please enter the customer name');
      nameRef.current?.focus();
      return;
    }
    const customer: CustomerInput = {
      name: form.custName.trim(),
      mobile: form.custMob,
      email: form.custEmail,
    };
    setBusy(true);
    try {
      await api.post('/customers', customer);
      for (const line of lines) {
        await api.post('/sales', {
          name: line.name,
          author: line.author,
          quantity: line.quantity,
          salePrice: line.salePrice,
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
              ref={nameRef}
              type="text"
              autoFocus
              value={form.custName}
              maxLength={30}
              onChange={set('custName')}
            />
          </label>
          <label>
            Mobile
            <input type="text" value={form.custMob} maxLength={15} onChange={set('custMob')} />
          </label>
          <label>
            Email
            <input type="text" value={form.custEmail} maxLength={30} onChange={set('custEmail')} />
          </label>
          <label>
            Book
            <input ref={bookRef} type="text" value={form.book} maxLength={30} onChange={set('book')} />
          </label>
          <label>
            Author
            <input type="text" value={form.author} maxLength={30} onChange={set('author')} />
          </label>
          <label>
            Quantity
            <input type="text" inputMode="numeric" value={form.quantity} maxLength={30} onChange={set('quantity')} />
          </label>
          <label>
            Sale Price
            <input
              ref={salePriceRef}
              type="text"
              inputMode="decimal"
              value={form.salePrice}
              maxLength={30}
              onChange={set('salePrice')}
            />
          </label>
          <label>
            Pay
            <input ref={payRef} type="text" inputMode="decimal" value={form.pay} maxLength={30} onChange={set('pay')} />
          </label>
        </fieldset>
        <div className="form-buttons">
          <button type="button" onClick={() => void add()}>
            Add
          </button>
          <button type="button" onClick={clearAll}>
            Clear
          </button>
          <button type="button" disabled={busy} onClick={() => void print()}>
            Print
          </button>
        </div>
      </form>
      <h4>Book Details</h4>
      <DataTable columns={COLUMNS} rows={lines} rowKey={(l) => l.key} emptyText="No books added" />
      <div className="sale-total">
        <span className="sale-total-label">Total :</span>{' '}
        <span className="sale-total-value" data-testid="sale-total">
          {total.toFixed(2)}
        </span>
      </div>
      {dialog}
    </div>
  );
}
