import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api';
import { useMessageBox } from '../components/ConfirmDialog';
import DataTable, { type Column } from '../components/DataTable';
import { useEnterChain } from '../hooks/useEnterChain';
import { LIMITS, type User, type UserInput } from '../types';

const COLUMNS: Column<User>[] = [
  { header: 'Id', render: (u) => u.id },
  { header: 'User Name', render: (u) => u.userName },
];

/** frmAdminSetting: list, add, edit and delete the users allowed to log in. */
export default function AdminSettingsPage() {
  const { showMessage, confirm, dialog } = useMessageBox();
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const onKeyDown = useEnterChain();

  const load = useCallback(async () => {
    try {
      setUsers(await api.get<User[]>('/admin/users'));
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

  const select = (u: User) => {
    setSelected(u);
    setUserName(u.userName);
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
    if (!(await validate(true))) return;
    await run(async () => {
      const body: UserInput = { userName: userName.trim(), password };
      await api.post<User>('/admin/users', body);
      clear();
      await showMessage('User added successfully');
    });
  };

  const update = async () => {
    if (!selected) {
      await showMessage('Please select a user to update');
      return;
    }
    if (!(await validate(false))) return;
    await run(async () => {
      const body: { userName: string; password?: string } = { userName: userName.trim() };
      if (password !== '') body.password = password;
      await api.put<User>(`/admin/users/${selected.id}`, body);
      clear();
      await showMessage('User updated successfully');
    });
  };

  const remove = async () => {
    if (!selected) {
      await showMessage('Please select a user to delete');
      return;
    }
    if (!(await confirm(`Are you sure you want to delete user '${selected.userName}'?`))) return;
    await run(async () => {
      await api.del(`/admin/users/${selected.id}`);
      clear();
      await showMessage('User deleted successfully');
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void (selected ? update() : add());
  };

  return (
    <div className="admin-page">
      <h3>Admin Settings</h3>
      <form className="admin-form" onSubmit={onSubmit} onKeyDown={onKeyDown}>
        <label>
          User Name
          <input
            type="text"
            value={userName}
            maxLength={LIMITS.user.userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            maxLength={LIMITS.user.password}
            placeholder={selected ? 'Leave blank to keep current' : ''}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="form-buttons">
          <button type="button" disabled={busy} onClick={() => void add()}>
            Add
          </button>
          <button type="button" disabled={busy || !selected} onClick={() => void update()}>
            Update
          </button>
          <button type="button" disabled={busy || !selected} onClick={() => void remove()}>
            Delete
          </button>
          <button type="button" disabled={busy} onClick={clear}>
            Clear
          </button>
        </div>
      </form>
      <DataTable
        columns={COLUMNS}
        rows={users}
        rowKey={(u) => u.id}
        selectedKey={selected?.id ?? null}
        onRowClick={select}
        emptyText="No users found"
      />
      {dialog}
    </div>
  );
}
