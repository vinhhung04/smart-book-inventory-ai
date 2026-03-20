import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router';
import { Search } from 'lucide-react';
import { customerCatalogService, CustomerCatalogBook } from '@/services/customer-catalog';
import { getApiErrorMessage } from '@/services/api';

export function CustomerCatalogPage() {
  const [books, setBooks] = useState<CustomerCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-slate-200 bg-white p-4">
        <h2 className="text-[20px] tracking-[-0.02em]" style={{ fontWeight: 700 }}>Book Catalog</h2>
        <p className="text-[12px] text-slate-500 mt-1">Search and explore available books from real inventory data.</p>

        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, author, ISBN..." className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] outline-none focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-300" />
          </div>
          <select value={availability} onChange={(e) => setAvailability(e.target.value as 'available' | 'unavailable' | '')} className="px-3 py-2.5 rounded-[10px] border border-slate-200 text-[13px] bg-white">
            <option value="">All availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Out of stock</option>
          </select>
        </div>

        <div className="mt-3 text-[12px] text-slate-500">
          Total: {stats.total} | Available: {stats.available} | Out of stock: {stats.unavailable}
        </div>
      </div>

      {loading ? (
        <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">Loading catalog...</div>
      ) : error ? (
        <div className="p-6 rounded-[14px] border border-rose-200 bg-rose-50 text-rose-700">{error}</div>
      ) : books.length === 0 ? (
        <div className="p-6 rounded-[14px] border border-slate-200 bg-white text-slate-500">No books found.</div>
      ) : (
        <div className="rounded-[14px] border border-slate-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">Title</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">Author</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">Category</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500">ISBN</th>
                <th className="text-right px-4 py-2.5 text-[11px] uppercase text-slate-500">Stock</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b last:border-0 border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-[13px]" style={{ fontWeight: 600 }}>{book.title}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{book.author || '-'}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{book.category || '-'}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{book.isbn || '-'}</td>
                  <td className="px-4 py-3 text-right text-[13px]" style={{ fontWeight: 700 }}>
                    <span className={Number(book.quantity || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}>{book.quantity || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <NavLink to={`/customer/books/${book.id}`} className="text-[12px] text-indigo-600 hover:text-indigo-800" style={{ fontWeight: 600 }}>View detail</NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
