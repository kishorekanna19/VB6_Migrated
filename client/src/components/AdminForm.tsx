import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, FIELD_LIMITS } from '../api';
import { useDialog } from './DialogProvider';
import DataTable from './DataTable';
import type { Column } from './DataTable';
import { useEnterAsTab } from '../hooks/useEnterAsTab';
import type { AdminUser } from '../types';

const columns: Column<AdminUser>[] = [
  { header: 'Id', render: (u) => u.id },
  { header: 'User Name', render: (u) => u.userName },
];

export default function AdminForm() {
  const { showMessage, confirm, dialog } = useDialog();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const onKeyDown = useEnterAsTab();

  const load = useCallback(async () => {
    try {
      setUsers(await api.get<AdminUser[]>('/admin/users'));
    } catch (err) {
      await showMessage(errorMessage(err));
    }
  }, [showMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const clear = () => {
    setSelected(null);
    setUserName('');
    setPassword('');
  };

  const pick = (user: AdminUser) => {
    setSelected(user);
    setUserName(user.userName);
    setPassword('');
  };

  const validate = async (requirePassword: boolean): Promise<boolean> => {
    if (userName.trim() === '') {
      await showMessage('Please enter the user name');
      return false;
    }
    if (requirePassword && password === '') {
      await showMessage('Please enter the password');
      return false;
    }
    return true;
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      await showMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (await validate(true)) {
      await run(async () => {
        const payload = { userName: userName.trim(), password };
        await api.post('/admin/users', payload);
        clear();
        await showMessage('User added successfully');
      });
    }
  };

  const update = async () => {
    if (selected) {
      if (await validate(false)) {
        await run(async () => {
          const payload: { userName: string; password?: string } = { userName: userName.trim() };
          if (password !== '') {
            payload.password = password;
          }
          await api.put(`/admin/users/${selected.id}`, payload);
          clear();
          await showMessage('User updated successfully');
        });
      }
    } else {
      await showMessage('Please select a user to update');
    }
  };

  const remove = async () => {
    if (selected) {
      if (await confirm(`Are you sure you want to delete user '${selected.userName}'?`)) {
        await run(async () => {
          await api.del(`/admin/users/${selected.id}`);
          clear();
          await showMessage('User deleted successfully');
        });
      }
    } else {
      await showMessage('Please select a user to delete');
    }
  };

  return (
    <div className="admin-page">
      <h3>Admin Settings</h3>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (selected) {
            void update();
          } else {
            void add();
          }
        }}
        onKeyDown={onKeyDown}
      >
        <label>
          User Name
          <input
            type="text"
            value={userName}
            maxLength={FIELD_LIMITS.user.userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            maxLength={FIELD_LIMITS.user.password}
            placeholder={selected ? 'Leave blank to keep current' : ''}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="form-buttons">
          <button
            type="button"
            className="btn-primary"
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={() => void add()}
          >
            Add
          </button>
          <button type="button" disabled={busy || !selected} onClick={() => void update()}>
            Update
          </button>
          <button type="button" className="btn-danger" disabled={busy || !selected} onClick={() => void remove()}>
            Delete
          </button>
          <button type="button" disabled={busy} onClick={clear}>
            Clear
          </button>
        </div>
      </form>
      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        selectedKey={selected?.id ?? null}
        onRowClick={pick}
        emptyText="No users found"
      />
      {dialog}
    </div>
  );
}
