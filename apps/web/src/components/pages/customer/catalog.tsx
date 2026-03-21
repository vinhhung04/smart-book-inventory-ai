import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { customerCatalogService, CustomerCatalogBook } from '@/services/customer-catalog';
import { customerBorrowService } from '@/services/customer-borrow';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';
import { SearchFilterBar } from './_shared/search-filter-bar';
import { LoadingState } from './_shared/loading-state';
import { EmptyState } from './_shared/empty-state';
import { CustomerStateBlock } from './_shared/customer-state-block';
import { BookCard } from './_shared/book-card';
import { DetailDrawer } from './_shared/detail-drawer';
import { StatusBadge } from './_shared/status-badge';
import { EmptyBooksIllustration } from './_shared/empty-state-illustrations';

export function CustomerCatalogPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<CustomerCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservingBookId, setReservingBookId] = useState<string | null>(null);
  const [previewBook, setPreviewBook] = useState<CustomerCatalogBook | null>(null);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState<'available' | 'unavailable' | ''>('');

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerCatalogService.getBooks({ search, availability });
      setBooks(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load catalog'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBooks();
  }, [search, availability]);

  const stats = useMemo(() => ({
    total: books.length,
    available: books.filter((b) => Number(b.quantity || 0) > 0).length,
    unavailable: books.filter((b) => Number(b.quantity || 0) <= 0).length,
  }), [books]);

  const handleReserve = async (book: CustomerCatalogBook) => {
    if (!book.variant_id || !book.default_warehouse_id) {
      toast.error('Book is not reservable right now');
      return;
    }

    try {
      setReservingBookId(book.id);
      await customerBorrowService.createReservation({
        variant_id: book.variant_id,
        warehouse_id: book.default_warehouse_id,
        pickup_location_id: book.default_location_id || null,
        quantity: 1,
      });
      toast.success('Reservation created successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reserve this book'));
    } finally {
      setReservingBookId(null);
    }
  };

  return (
    <div className="space-y-4">

      <div className="relative overflow-hidden rounded-[16px] border border-cyan-200/70 bg-gradient-to-br from-indigo-50 via-cyan-50/80 to-white px-5 py-4">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-200/35 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-indigo-200/35 blur-2xl" />
        <div className="relative">
          <h2 className="text-[19px] tracking-[-0.02em] text-slate-900" style={{ fontWeight: 700 }}>Browse the Catalog</h2>
          <p className="mt-1 text-[12px] text-slate-600">Find books fast, preview details, and reserve in one click.</p>
        </div>
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title, author, ISBN..."
        filters={
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as 'available' | 'unavailable' | '')}
            className="h-10 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] text-slate-700"
          >
            <option value="">All availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Out of stock</option>
          </select>
        }
        actions={
          <button
            onClick={() => void loadBooks()}
            className="h-10 rounded-[10px] border border-slate-200 bg-white px-3 text-[12px] text-slate-600 hover:bg-slate-50"
            style={{ fontWeight: 600 }}
          >
            Refresh
          </button>
        }
      />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-[16px] text-slate-900" style={{ fontWeight: 700 }}>Catalog</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">Total: {stats.total} | Available: {stats.available} | Out of stock: {stats.unavailable}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">Available: {stats.available}</span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">Out: {stats.unavailable}</span>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading catalog..." />
        ) : error ? (
          <CustomerStateBlock mode="error" message={error} />
        ) : books.length === 0 ? (
          <EmptyState
            message="No books found. Try changing filters or search keyword."
            illustration={<EmptyBooksIllustration />}
            action={
              <button
                onClick={() => {
                  setSearch('');
                  setAvailability('');
                }}
                className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50"
                style={{ fontWeight: 600 }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onView={(bookId) => {
                  const found = books.find((row) => row.id === bookId) || null;
                  setPreviewBook(found);
                }}
                onReserve={handleReserve}
                reserving={reservingBookId === book.id}
              />
            ))}
          </div>
        )}
      </section>

      <DetailDrawer
        open={Boolean(previewBook)}
        title={previewBook?.title || 'Book preview'}
        onClose={() => setPreviewBook(null)}
      >
        {previewBook ? (
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-slate-600">{previewBook.author || 'Unknown author'}</p>
              <StatusBadge status={Number(previewBook.quantity || 0) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'} />
            </div>
            <div className="rounded-[10px] border border-slate-200 bg-white p-3 text-slate-600">
              <p><span className="text-slate-500">Category:</span> {previewBook.category || '-'}</p>
              <p className="mt-1"><span className="text-slate-500">ISBN:</span> {previewBook.isbn || '-'}</p>
              <p className="mt-1"><span className="text-slate-500">Stock:</span> {previewBook.quantity || 0}</p>
            </div>
            <p className="text-[12px] text-slate-500">{previewBook.description || 'No description available.'}</p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleReserve(previewBook)}
                disabled={reservingBookId === previewBook.id || Number(previewBook.quantity || 0) <= 0}
                className="rounded-[10px] bg-indigo-600 px-3 py-2 text-[12px] text-white hover:bg-indigo-700 disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                {reservingBookId === previewBook.id ? 'Reserving...' : 'Reserve'}
              </button>
              <button
                onClick={() => navigate(`/customer/books/${previewBook.id}`)}
                className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50"
                style={{ fontWeight: 600 }}
              >
                Open detail page
              </button>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
