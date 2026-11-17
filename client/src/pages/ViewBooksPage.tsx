import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function ViewBooksPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);

  const load = useCallback(async () => {
    try {
      setBooks(await api.get<Book[]>('/books'));
      setSelected(null);
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  }, [showMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async () => {
    if (!selected) {
      await showMessage('Please select a record');
    } else if (await confirm('Do you want delete.')) {
      try {
        await api.del(`/books/${selected.id}`);
        await load();
        await showMessage('record deleted.');
      } catch (err) {
        await showMessage(errorMessage(err));
      }
    }
  };

  return (
    <div className="book-page">
      <h3>Book Details</h3>
      <DataTable
        columns={columns}
        rows={books}
        rowKey={(b) => b.id}
        selectedKey={selected?.id ?? null}
        onRowClick={setSelected}
        emptyText="No books found"
      />
      <div className="form-buttons">
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          Print book list
        </button>
        <button type="button" className="btn-danger" onClick={() => void onDelete()}>
          Delete
        </button>
        <button type="button" onClick={() => navigate('/home')}>
          Close
        </button>
      </div>
      {dialog}
    </div>
  );
}
