import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api';
import { useDialog } from '../components/DialogProvider';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
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

export default function BookStockPage() {
  const { showMessage, confirm, dialog } = useDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Book | null>(null);

  const load = useCallback(
    async (term: string) => {
      try {
        const name = term.trim();
        const path = name === '' ? '/books' : `/books?name=${encodeURIComponent(name)}`;
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

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void load(search);
    }
  };

  const onDelete = async () => {
    if (!selected) {
      await showMessage('Please select a record');
    } else if (await confirm('Do you want delete.')) {
      try {
        await api.del(`/books/${selected.id}`);
        await load(search);
        await showMessage('record deleted.');
      } catch (err) {
        await showMessage(errorMessage(err));
      }
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
            onKeyDown={onSearchKey}
          />
        </label>
        <button type="button" className="btn-danger" onClick={() => void onDelete()}>
          Delete
        </button>
      </div>
      <DataTable
        columns={columns}
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
