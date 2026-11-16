import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

/** frmViewBookDetails: list of all books with print, delete and close. */
export default function ViewBooksPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useMessageBox();
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

  const remove = async () => {
    if (!selected) {
      await showMessage('Please select a record');
      return;
    }
    if (!(await confirm('Do you want delete.'))) return;
    try {
      await api.del(`/books/${selected.id}`);
      await load();
      await showMessage('record deleted.');
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  };

  return (
    <div className="book-page">
      <h3>Book Details</h3>
      <DataTable
        columns={COLUMNS}
        rows={books}
        rowKey={(b) => b.id}
        selectedKey={selected?.id ?? null}
        onRowClick={setSelected}
        emptyText="No books found"
      />
      <div className="form-buttons">
        <button type="button" onClick={() => window.print()}>
          Print book list
        </button>
        <button type="button" onClick={() => void remove()}>
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
