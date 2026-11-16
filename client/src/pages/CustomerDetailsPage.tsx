import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import DataTable, { type Column } from '../components/DataTable';
import type { Customer } from '../types';

const COLUMNS: Column<Customer>[] = [
  { header: 'Customer Name', render: (c) => c.name },
  { header: 'Mobile', render: (c) => c.mobile },
  { header: 'Email', render: (c) => c.email },
];

/** frmCustomerDetails: customer report grid with delete (after confirmation). */
export default function CustomerDetailsPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useMessageBox();
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

  const remove = async () => {
    if (!selected) {
      await showMessage('Please select a record');
      return;
    }
    if (!(await confirm('Do you want delete.', 'Exit ?'))) return;
    try {
      await api.del(`/customers/${selected.id}`);
      await load();
      await showMessage('record deleted.', 'Information');
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  };

  return (
    <div className="book-page">
      <h3>Customer Details</h3>
      <DataTable
        columns={COLUMNS}
        rows={customers}
        rowKey={(c) => c.id}
        selectedKey={selected?.id ?? null}
        onRowClick={setSelected}
        emptyText="No customers found"
      />
      <div className="form-buttons">
        <button type="button" onClick={() => void remove()}>
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
