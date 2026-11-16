import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Book } from '../types';
import type * as ApiModule from '../api';
import BookStockPage from './BookStockPage';
import EditBookPage from './EditBookPage';
import NewBookPage from './NewBookPage';
import ViewBooksPage from './ViewBooksPage';

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

const BOOKS: Book[] = [
  { id: 1, name: 'Alpha', author: 'A1', publication: 'P1', edition: '1st', quantity: 5, purchasePrice: 10, salePrice: 15 },
  { id: 2, name: 'Beta', author: 'A2', publication: 'P2', edition: '2nd', quantity: 3, purchasePrice: 20, salePrice: 25 },
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
  mocks.get.mockResolvedValue(BOOKS);
});

afterEach(() => cleanup());

describe('NewBookPage', () => {
  it('posts all 7 fields, shows Record saved. and clears the form', async () => {
    mocks.post.mockResolvedValue({ id: 3 });
    renderPage(<NewBookPage />);
    await screen.findByText('Alpha');

    fireEvent.change(input('Book name'), { target: { value: 'Gamma' } });
    fireEvent.change(input('Author'), { target: { value: 'G. Author' } });
    fireEvent.change(input('Publication'), { target: { value: 'Pub' } });
    fireEvent.change(input('Edition'), { target: { value: '3rd' } });
    fireEvent.change(input('Quantity'), { target: { value: '7' } });
    fireEvent.change(input('Purchase Price'), { target: { value: '12.5' } });
    fireEvent.change(input('Sale Price'), { target: { value: '18' } });
    fireEvent.click(screen.getByText('Save'));

    await screen.findByText('Record saved.');
    expect(mocks.post).toHaveBeenCalledWith('/books', {
      name: 'Gamma',
      author: 'G. Author',
      publication: 'Pub',
      edition: '3rd',
      quantity: 7,
      purchasePrice: 12.5,
      salePrice: 18,
    });
    expect(input('Book name').value).toBe('');
    expect(input('Quantity').value).toBe('');
    expect(input('Sale Price').value).toBe('');
  });

  it('does not post when the book name is empty', async () => {
    renderPage(<NewBookPage />);
    await screen.findByText('Alpha');
    fireEvent.click(screen.getByText('Save'));
    await screen.findByText('Please enter the book name');
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('Clear empties the fields', async () => {
    renderPage(<NewBookPage />);
    await screen.findByText('Alpha');
    fireEvent.change(input('Author'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Clear'));
    expect(input('Author').value).toBe('');
  });

  it('Enter moves focus through the fields in source order up to Save', async () => {
    renderPage(<NewBookPage />);
    await screen.findByText('Alpha');
    const order = [
      input('Book name'),
      input('Author'),
      input('Publication'),
      input('Edition'),
      input('Quantity'),
      input('Purchase Price'),
      input('Sale Price'),
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

describe('EditBookPage', () => {
  it('shows boundary messages on Previous/Next', async () => {
    renderPage(<EditBookPage />);
    await waitFor(() => expect(input('Book name').value).toBe('Alpha'));

    fireEvent.click(screen.getByText('Previous'));
    await screen.findByText('You reached at first data');
    fireEvent.click(screen.getByText('OK'));

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(input('Book name').value).toBe('Beta'));
    expect(input('Quantity').value).toBe('3');

    fireEvent.click(screen.getByText('Next'));
    await screen.findByText('You reached at last data');
  });

  it('updates the shown book with PUT and reports Details Updated.', async () => {
    mocks.put.mockResolvedValue(BOOKS[0]);
    renderPage(<EditBookPage />);
    await waitFor(() => expect(input('Book name').value).toBe('Alpha'));
    fireEvent.change(input('Quantity'), { target: { value: '9' } });
    fireEvent.click(screen.getByText('Update'));
    await screen.findByText('Details Updated.');
    expect(mocks.put).toHaveBeenCalledWith('/books/1', {
      name: 'Alpha',
      author: 'A1',
      publication: 'P1',
      edition: '1st',
      quantity: 9,
      purchasePrice: 10,
      salePrice: 15,
    });
  });

  it('asks for confirmation before deleting', async () => {
    mocks.del.mockResolvedValue(undefined);
    renderPage(<EditBookPage />);
    await waitFor(() => expect(input('Book name').value).toBe('Alpha'));
    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('Do you want delete.');
    expect(mocks.del).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Yes'));
    await screen.findByText('record deleted.');
    expect(mocks.del).toHaveBeenCalledWith('/books/1');
  });

  it('does not delete when the confirmation is declined', async () => {
    renderPage(<EditBookPage />);
    await waitFor(() => expect(input('Book name').value).toBe('Alpha'));
    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('Do you want delete.');
    fireEvent.click(screen.getByText('No'));
    await waitFor(() => expect(screen.queryByText('Do you want delete.')).toBeNull());
    expect(mocks.del).not.toHaveBeenCalled();
  });
});

describe('BookStockPage', () => {
  it('searches by name when Enter is pressed', async () => {
    renderPage(<BookStockPage />);
    await screen.findByText('Beta');
    mocks.get.mockResolvedValue([BOOKS[0]]);
    const search = screen.getByLabelText('Search');
    fireEvent.change(search, { target: { value: 'Alpha' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    await waitFor(() => expect(screen.queryByText('Beta')).toBeNull());
    expect(mocks.get).toHaveBeenLastCalledWith('/books?name=Alpha');
    expect(screen.getByText('Alpha')).toBeTruthy();
  });

  it('selects the search text on focus', async () => {
    renderPage(<BookStockPage />);
    await screen.findByText('Beta');
    const search = screen.getByLabelText('Search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'Alpha' } });
    fireEvent.focus(search);
    expect(search.selectionStart).toBe(0);
    expect(search.selectionEnd).toBe(5);
  });

  it('deletes the selected row after confirmation', async () => {
    mocks.del.mockResolvedValue(undefined);
    renderPage(<BookStockPage />);
    fireEvent.click(await screen.findByText('Beta'));
    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('Do you want delete.');
    expect(mocks.del).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Yes'));
    await screen.findByText('record deleted.');
    expect(mocks.del).toHaveBeenCalledWith('/books/2');
  });
});

describe('ViewBooksPage', () => {
  it('lists the books and prints the list', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderPage(<ViewBooksPage />);
    await screen.findByText('Alpha');
    expect(screen.getByText('Beta')).toBeTruthy();
    fireEvent.click(screen.getByText('Print book list'));
    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });

  it('deletes the selected book after confirmation', async () => {
    mocks.del.mockResolvedValue(undefined);
    renderPage(<ViewBooksPage />);
    fireEvent.click(await screen.findByText('Alpha'));
    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('Do you want delete.');
    fireEvent.click(screen.getByText('Yes'));
    await screen.findByText('record deleted.');
    expect(mocks.del).toHaveBeenCalledWith('/books/1');
  });
});
