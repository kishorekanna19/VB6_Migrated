import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Customer, Order } from '../types';
import type * as ApiModule from '../api';
import CustomerDetailsPage from './CustomerDetailsPage';
import NewOrderPage from './NewOrderPage';
import OrderDetailsPage from './OrderDetailsPage';
import SalePage from './SalePage';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>();
  return { ...actual, api: mocks };
});

const ORDERS: Order[] = [
  { id: 1, book: 'Alpha', author: 'A1', publication: 'P1', quantity: 2, cusName: 'Ann', cusMob: '111', cusEmail: 'a@x.com' },
  { id: 2, book: 'Beta', author: 'A2', publication: 'P2', quantity: 4, cusName: 'Bob', cusMob: '222', cusEmail: 'b@x.com' },
];

const CUSTOMERS: Customer[] = [
  { id: 1, name: 'Cust One', mobile: '111', email: 'c1@x.com' },
  { id: 2, name: 'Cust Two', mobile: '222', email: 'c2@x.com' },
];

function renderPage(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function input(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.put.mockReset();
  mocks.del.mockReset();
  mocks.get.mockResolvedValue([]);
});

afterEach(() => cleanup());

describe('NewOrderPage', () => {
  it('posts all 7 fields and shows Record saved.', async () => {
    mocks.get.mockResolvedValue(ORDERS);
    mocks.post.mockResolvedValue({ id: 3 });
    renderPage(<NewOrderPage />);
    await screen.findByText('Alpha');

    fireEvent.change(input('Customer name'), { target: { value: 'Cara' } });
    fireEvent.change(input('Mobile'), { target: { value: '999' } });
    fireEvent.change(input('Email'), { target: { value: 'c@x.com' } });
    fireEvent.change(input('Book'), { target: { value: 'Gamma' } });
    fireEvent.change(input('Author'), { target: { value: 'G. Author' } });
    fireEvent.change(input('Publication'), { target: { value: 'Pub' } });
    fireEvent.change(input('Quantity'), { target: { value: '6' } });
    fireEvent.click(screen.getByText('Save'));

    await screen.findByText('Record saved.');
    expect(mocks.post).toHaveBeenCalledWith('/orders', {
      book: 'Gamma',
      author: 'G. Author',
      publication: 'Pub',
      quantity: 6,
      cusName: 'Cara',
      cusMob: '999',
      cusEmail: 'c@x.com',
    });
  });

  it('Clear and New empty the fields', async () => {
    renderPage(<NewOrderPage />);
    fireEvent.change(input('Author'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Clear'));
    expect(input('Author').value).toBe('');
    fireEvent.change(input('Book'), { target: { value: 'y' } });
    fireEvent.click(screen.getByText('New'));
    expect(input('Book').value).toBe('');
  });

  it('Enter moves focus through the fields in source order up to Save', async () => {
    renderPage(<NewOrderPage />);
    const order = [
      input('Customer name'),
      input('Mobile'),
      input('Email'),
      input('Book'),
      input('Author'),
      input('Publication'),
      input('Quantity'),
      screen.getByText('Save'),
    ];
    order[0].focus();
    for (let i = 0; i < order.length - 1; i++) {
      expect(document.activeElement).toBe(order[i]);
      fireEvent.keyDown(order[i], { key: 'Enter' });
    }
    expect(document.activeElement).toBe(order[order.length - 1]);
  });
});

describe('SalePage', () => {
  function fillLine(book: string, author: string, qty: string, price: string) {
    fireEvent.change(input('Book'), { target: { value: book } });
    fireEvent.change(input('Author'), { target: { value: author } });
    fireEvent.change(input('Quantity'), { target: { value: qty } });
    fireEvent.change(input('Sale Price'), { target: { value: price } });
  }

  it('Enter in Sale Price sets Pay to quantity x price and focuses Pay', () => {
    renderPage(<SalePage />);
    fireEvent.change(input('Quantity'), { target: { value: '3' } });
    fireEvent.change(input('Sale Price'), { target: { value: '2.5' } });
    input('Sale Price').focus();
    fireEvent.keyDown(input('Sale Price'), { key: 'Enter' });
    expect(input('Pay').value).toBe('7.5');
    expect(document.activeElement).toBe(input('Pay'));
  });

  it('Enter moves focus name > mobile > email > book > author > quantity > sale price', () => {
    renderPage(<SalePage />);
    const order = [
      input('Customer name'),
      input('Mobile'),
      input('Email'),
      input('Book'),
      input('Author'),
      input('Quantity'),
      input('Sale Price'),
    ];
    order[0].focus();
    for (let i = 0; i < order.length - 1; i++) {
      expect(document.activeElement).toBe(order[i]);
      fireEvent.keyDown(order[i], { key: 'Enter' });
    }
    expect(document.activeElement).toBe(order[order.length - 1]);
  });

  it('Add puts lines in the grid, clears the line fields and Total sums them', async () => {
    renderPage(<SalePage />);
    fillLine('Alpha', 'A1', '2', '10');
    fireEvent.click(screen.getByText('Add'));
    await screen.findByText('Alpha');
    expect(input('Book').value).toBe('');
    expect(input('Quantity').value).toBe('');
    expect(input('Sale Price').value).toBe('');
    expect(input('Pay').value).toBe('');

    fillLine('Beta', 'A2', '3', '5');
    fireEvent.click(screen.getByText('Add'));
    await screen.findByText('Beta');
    expect(screen.getByTestId('sale-total').textContent).toBe('35.00');
  });

  it('Clear clears the fields and the grid', async () => {
    renderPage(<SalePage />);
    fireEvent.change(input('Customer name'), { target: { value: 'Zed' } });
    fillLine('Alpha', 'A1', '2', '10');
    fireEvent.click(screen.getByText('Add'));
    await screen.findByText('Alpha');
    fireEvent.click(screen.getByText('Clear'));
    expect(input('Customer name').value).toBe('');
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.getByTestId('sale-total').textContent).toBe('0.00');
  });

  it('Print saves the customer and the lines, prints and clears the form', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    mocks.post.mockResolvedValue({});
    renderPage(<SalePage />);
    fireEvent.change(input('Customer name'), { target: { value: 'Zed' } });
    fireEvent.change(input('Mobile'), { target: { value: '555' } });
    fireEvent.change(input('Email'), { target: { value: 'z@x.com' } });
    fillLine('Alpha', 'A1', '2', '10');
    fireEvent.click(screen.getByText('Add'));
    await screen.findByText('Alpha');

    fireEvent.click(screen.getByText('Print'));
    await waitFor(() => expect(print).toHaveBeenCalled());
    expect(mocks.post).toHaveBeenCalledWith('/customers', { name: 'Zed', mobile: '555', email: 'z@x.com' });
    expect(mocks.post).toHaveBeenCalledWith('/sales', {
      name: 'Alpha',
      author: 'A1',
      quantity: '2',
      salePrice: '10',
    });
    await waitFor(() => expect(input('Customer name').value).toBe(''));
    expect(screen.queryByText('Alpha')).toBeNull();
    print.mockRestore();
  });
});

describe('CustomerDetailsPage', () => {
  it('deletes the selected row after confirmation', async () => {
    mocks.get.mockResolvedValue(CUSTOMERS);
    mocks.del.mockResolvedValue(undefined);
    renderPage(<CustomerDetailsPage />);
    fireEvent.click(await screen.findByText('Cust Two'));
    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('Do you want delete.');
    expect(mocks.del).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Yes'));
    await screen.findByText('record deleted.');
    expect(mocks.del).toHaveBeenCalledWith('/customers/2');
  });

  it('does not delete when declined', async () => {
    mocks.get.mockResolvedValue(CUSTOMERS);
    renderPage(<CustomerDetailsPage />);
    fireEvent.click(await screen.findByText('Cust One'));
    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('Do you want delete.');
    fireEvent.click(screen.getByText('No'));
    await waitFor(() => expect(screen.queryByText('Do you want delete.')).toBeNull());
    expect(mocks.del).not.toHaveBeenCalled();
  });
});

describe('OrderDetailsPage', () => {
  it('deletes the selected row after confirmation', async () => {
    mocks.get.mockResolvedValue(ORDERS);
    mocks.del.mockResolvedValue(undefined);
    renderPage(<OrderDetailsPage />);
    fireEvent.click(await screen.findByText('Beta'));
    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('Do you want delete.');
    expect(mocks.del).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Yes'));
    await screen.findByText('record deleted.');
    expect(mocks.del).toHaveBeenCalledWith('/orders/2');
  });
});
