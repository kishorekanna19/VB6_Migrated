import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useDialog } from '../components/DialogProvider';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import type { Order } from '../types';

const columns: Column<Order>[] = [
  { header: 'Book', render: (o) => o.book },
  { header: 'Author', render: (o) => o.author },
  { header: 'Publication', render: (o) => o.publication },
  { header: 'Quantity', render: (o) => o.quantity, align: 'right' },
  { header: 'Customer Name', render: (o) => o.cusName },
  { header: 'Mobile', render: (o) => o.cusMob },
  { header: 'Email', render: (o) => o.cusEmail },
];

export default function OrderDetailsPage() {
  const navigate = useNavigate();
  const { showMessage, confirm, dialog } = useDialog();
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

  const onDelete = async () => {
    if (!selected) {
      await showMessage('Please select a record');
    } else if (await confirm('Do you want delete.', 'Exit ?')) {
      try {
        await api.del(`/orders/${selected.id}`);
        await load();
        await showMessage('record deleted.', 'Information');
      } catch (err) {
        await showMessage(errorMessage(err));
      }
    }
  };

  return (
    <div className="book-page">
      <h3>Order Details</h3>
      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(o) => o.id}
        selectedKey={selected?.id ?? null}
        onRowClick={setSelected}
        emptyText="No orders found"
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
