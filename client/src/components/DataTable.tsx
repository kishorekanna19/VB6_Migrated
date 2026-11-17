import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  selectedKey?: string | number | null;
  onRowClick?: (row: T) => void;
  emptyText?: string;
}

/** Renders a cell value; blank / null / whitespace-only values keep a stable row height. */
function cellContent(value: ReactNode): ReactNode {
  if (value === null || value === undefined) return '\u00a0';
  if (typeof value === 'string' && value.trim() === '') return '\u00a0';
  return value;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectedKey = null,
  onRowClick,
  emptyText = 'No records found',
}: DataTableProps<T>) {
  return (
    <div className="data-table-wrap" role="region" aria-label="Data table" tabIndex={0}>
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
                  aria-selected={onRowClick ? key === selectedKey : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.header} style={{ textAlign: c.align ?? 'left' }}>
                      {cellContent(c.render(row))}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
