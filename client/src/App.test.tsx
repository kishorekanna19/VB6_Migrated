import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

beforeEach(() => sessionStorage.clear());
afterEach(() => cleanup());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('shows the splash screen at the root route', () => {
    renderAt('/');
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('redirects unauthenticated access to the login page', () => {
    renderAt('/books/new');
    expect(screen.getByLabelText('User Name')).toBeTruthy();
  });

  it('shows the main layout when a session exists', () => {
    sessionStorage.setItem('bookshop.token', 'x');
    sessionStorage.setItem('bookshop.user', JSON.stringify({ id: 1, userName: 'admin' }));
    renderAt('/home');
    expect(screen.getByText('Welcome to Kora Kagaz')).toBeTruthy();
    expect(screen.getByText('Logout')).toBeTruthy();
  });
});
