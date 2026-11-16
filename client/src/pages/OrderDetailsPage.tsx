import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import DataTable, { type Column } from '../components/DataTable';
import type { Order } from '../types';

const COLUMNS: Column<Order>[] = [
  { header: 'Book', render: (o) => o.book },
  { header: 'Author', render: (o) => o.author },
  { header: 'Publication', render: (o) => o.publication },
  { header: 'Quantity', render: (o) => o.quantity, align: 'right' },
  { header: 'Customer Name', render: (o) => o.cusName },
  { header: 'Mobile', render: (o) => o.cusMob },
  { header: 'Email', render: (o) => o.cusEmail },
];

/** frmOrderDetails: order report grid with delete (after confirmation). */
export default function OrderDetailsPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useMessageBox();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await api.get<Order[]>('/orders'));
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
      await api.del(`/orders/${selected.id}`);
      await load();
      await showMessage('record deleted.', 'Information');
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  };

  return (
    <div className="book-page">
      <h3>Order Details</h3>
      <DataTable
        columns={COLUMNS}
        rows={orders}
        rowKey={(o) => o.id}
        selectedKey={selected?.id ?? null}
        onRowClick={setSelected}
        emptyText="No orders found"
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
