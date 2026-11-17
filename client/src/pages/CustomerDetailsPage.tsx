import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useDialog } from '../components/DialogProvider';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import type { Customer } from '../types';

const columns: Column<Customer>[] = [
  { header: 'Customer Name', render: (c) => c.name },
  { header: 'Mobile', render: (c) => c.mobile },
  { header: 'Email', render: (c) => c.email },
];

export default function CustomerDetailsPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useDialog();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    try {
      setCustomers(await api.get<Customer[]>('/customers'));
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
    } else if (await confirm('Do you want delete.', 'Exit ?')) {
      try {
        await api.del(`/customers/${selected.id}`);
        await load();
        await showMessage('record deleted.', 'Information');
      } catch (err) {
        await showMessage(errorMessage(err));
      }
    }
  };

  return (
    <div className="book-page">
      <h3>Customer Details</h3>
      <DataTable
        columns={columns}
        rows={customers}
        rowKey={(c) => c.id}
        selectedKey={selected?.id ?? null}
        onRowClick={setSelected}
        emptyText="No customers found"
      />
      <div className="form-buttons">
        <button type="button" className="btn-danger" onClick={() => void onDelete()}>
          Delete
        </button>
        <button type="button" onClick={() => navigate('/home')}>
          Exit
        </button>
      </div>
      {dialog}
    </div>
  );
}
