import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  selectedKey?: string | number | null;
  onRowClick?: (row: T) => void;
  emptyText?: string;
}

/** Simple grid (replacement for the VB DataGrid / MSFlexGrid). */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectedKey = null,
  onRowClick,
  emptyText = 'No records found',
}: DataTableProps<T>) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.header} style={{ textAlign: c.align ?? 'left' }}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="data-table-empty">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                className={key === selectedKey ? 'selected' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((c) => (
                  <td key={c.header} style={{ textAlign: c.align ?? 'left' }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
