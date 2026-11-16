import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import DataTable, { type Column } from '../components/DataTable';
import type { Book } from '../types';

const COLUMNS: Column<Book>[] = [
  { header: 'Book Name', render: (b) => b.name },
  { header: 'Author', render: (b) => b.author },
  { header: 'Publication', render: (b) => b.publication },
  { header: 'Edition', render: (b) => b.edition },
  { header: 'Quantity', render: (b) => b.quantity, align: 'right' },
  { header: 'Purchase Price', render: (b) => b.purchasePrice, align: 'right' },
  { header: 'Sale Price', render: (b) => b.salePrice, align: 'right' },
];

/** frmBookStock: books in stock, searchable by name, with delete. */
export default function BookStockPage() {
  const { showMessage, confirm, dialog } = useMessageBox();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Book | null>(null);

  const load = useCallback(
    async (name: string) => {
      try {
        const term = name.trim();
        const path = term === '' ? '/books' : `/books?name=${encodeURIComponent(term)}`;
        setBooks(await api.get<Book[]>(path));
        setSelected(null);
      } catch (err) {
        await showMessage(errorMessage(err));
      }
    },
    [showMessage],
  );

  useEffect(() => {
    void load('');
  }, [load]);

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void load(search);
    }
  };

  const remove = async () => {
    if (!selected) {
      await showMessage('Please select a record');
      return;
    }
    if (!(await confirm('Do you want delete.'))) return;
    try {
      await api.del(`/books/${selected.id}`);
      await load(search);
      await showMessage('record deleted.');
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  };

  return (
    <div className="book-page">
      <h3>Books In Stock</h3>
      <div className="search-bar">
        <label>
          Search
          <input
            type="text"
            value={search}
            placeholder="Book name"
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={onSearchKeyDown}
          />
        </label>
        <button type="button" onClick={() => void remove()}>
          Delete
        </button>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={books}
        rowKey={(b) => b.id}
        selectedKey={selected?.id ?? null}
        onRowClick={setSelected}
        emptyText="No books found"
      />
      {dialog}
    </div>
  );
}
