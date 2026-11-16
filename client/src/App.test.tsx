import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

afterEach(() => cleanup());

describe('App', () => {
  it('shows the splash screen at the root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows the main layout at /main', () => {
    render(
      <MemoryRouter initialEntries={['/main']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText('Welcome')).toBeTruthy();
  });
});
