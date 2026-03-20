import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router';
import { customerCatalogService, CustomerCatalogBook } from '@/services/customer-catalog';
import { getApiErrorMessage } from '@/services/api';
import { customerBorrowService } from '@/services/customer-borrow';
import { toast } from 'sonner';

export function CustomerBookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<CustomerCatalogBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await customerCatalogService.getBookById(id);
        setBook(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load book detail'));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id]);

  if (loading) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading book detail...</div>;
  }

  if (error) {
    return <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>;
  }

  if (!book) {
    return <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Book not found.</div>;
  }

  const isAvailable = Number(book.quantity || 0) > 0;

  const handleReserve = async () => {
    if (!book.variant_id || !book.default_warehouse_id) {
      toast.error('Book is not reservable right now');
      return;
    }

    try {
      setIsReserving(true);
      await customerBorrowService.createReservation({
        variant_id: book.variant_id,
        warehouse_id: book.default_warehouse_id,
        pickup_location_id: book.default_location_id || null,
        quantity: 1,
      });
      toast.success('Reservation created successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create reservation'));
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="space-y-4">
      <NavLink to="/customer/books" className="text-[12px] text-indigo-600 hover:text-indigo-800" style={{ fontWeight: 600 }}>Back to catalog</NavLink>
      <div className="rounded-[14px] border border-slate-200 bg-white p-6">
        <h2 className="text-[22px] tracking-[-0.02em]" style={{ fontWeight: 700 }}>{book.title}</h2>
        <p className="text-[13px] text-slate-500 mt-1">{book.subtitle || '-'}</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
          <div><span className="text-slate-500">Author:</span> {book.author || '-'}</div>
          <div><span className="text-slate-500">Category:</span> {book.category || '-'}</div>
          <div><span className="text-slate-500">Publisher:</span> {book.publisher || '-'}</div>
          <div><span className="text-slate-500">ISBN:</span> {book.isbn || '-'}</div>
          <div><span className="text-slate-500">Stock:</span> {book.quantity || 0}</div>
          <div>
            <span className="text-slate-500">Availability:</span>{' '}
            <span className={isAvailable ? 'text-emerald-600' : 'text-rose-600'} style={{ fontWeight: 600 }}>
              {isAvailable ? 'Available' : 'Out of stock'}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-[13px] text-slate-700" style={{ fontWeight: 600 }}>Description</h3>
          <p className="text-[13px] text-slate-600 mt-2 whitespace-pre-line">{book.description || '-'}</p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => void handleReserve()}
            disabled={!book.reservable || !isAvailable || isReserving}
            className="px-4 py-2.5 rounded-[10px] bg-indigo-600 text-white text-[13px] disabled:opacity-60"
          >
            {isReserving ? 'Reserving...' : 'Reserve This Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
