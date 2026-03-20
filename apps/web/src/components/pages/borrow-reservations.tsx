import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoaderCircle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, FadeItem } from '../motion-utils';
import { StatusBadge } from '../status-badge';
import {
  borrowService,
  type Reservation,
  type ReservationSource,
  type ReservationStatus,
  type VariantLookupItem,
  type WarehouseLookupItem,
} from '@/services/borrow';
import { getApiErrorMessage } from '@/services/api';
import { warehouseService, type WarehouseLocation } from '@/services/warehouse';

const statuses: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 'CANCELLED', 'EXPIRED', 'CONVERTED_TO_LOAN'];

interface ReservationFormState {
  customer_id: string;
  variant_id: string;
  warehouse_id: string;
  pickup_location_id: string;
  quantity: string;
  source_channel: ReservationSource;
  notes: string;
}

interface CustomerLookupItem {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  customer_code: string;
}

const initialFormState: ReservationFormState = {
  customer_id: '',
  variant_id: '',
  warehouse_id: '',
  pickup_location_id: '',
  quantity: '1',
  source_channel: 'WEB',
  notes: '',
};

function getVariant(status: ReservationStatus) {
  if (status === 'PENDING') return 'warning';
  if (status === 'CONFIRMED' || status === 'READY_FOR_PICKUP') return 'info';
  if (status === 'CONVERTED_TO_LOAN') return 'success';
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'neutral';
  return 'primary';
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

export function BorrowReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReservationStatus>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<ReservationFormState>(initialFormState);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerLookupItem[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [variantQuery, setVariantQuery] = useState('');
  const [variantOptions, setVariantOptions] = useState<VariantLookupItem[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseLookupItem[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [pickupQuery, setPickupQuery] = useState('');
  const [pickupLocations, setPickupLocations] = useState<WarehouseLocation[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const response = await borrowService.getReservations();
      setReservations(response.data ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load reservations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReservations();
  }, []);

  useEffect(() => {
    if (!formOpen) return;

    const keyword = customerQuery.trim();
    if (keyword.length < 2) {
      setCustomerOptions([]);
      setCustomerLoading(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setCustomerLoading(true);
        const response = await borrowService.getCustomers({ q: keyword, pageSize: 8, status: 'ACTIVE' });
        if (!active) return;
        setCustomerOptions(response.data ?? []);
      } catch {
        if (!active) return;
        setCustomerOptions([]);
      } finally {
        if (active) {
          setCustomerLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [customerQuery, formOpen]);

  useEffect(() => {
    if (!formOpen) return;

    const keyword = variantQuery.trim();
    if (!keyword || isUuid(keyword)) {
      setVariantOptions([]);
      setVariantLoading(false);
      return;
    }

    if (keyword.length < 2) {
      setVariantOptions([]);
      setVariantLoading(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setVariantLoading(true);
        const response = await borrowService.searchVariants({ q: keyword, limit: 8 });
        if (!active) return;
        setVariantOptions(response.data ?? []);
      } catch {
        if (!active) return;
        setVariantOptions([]);
      } finally {
        if (active) {
          setVariantLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [variantQuery, formOpen]);

  useEffect(() => {
    if (!formOpen) return;

    const keyword = warehouseQuery.trim();
    if (keyword && isUuid(keyword)) {
      setWarehouseOptions([]);
      setWarehouseLoading(false);
      return;
    }

    if (keyword.length === 1) {
      setWarehouseOptions([]);
      setWarehouseLoading(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setWarehouseLoading(true);
        const response = await borrowService.searchWarehouses({ q: keyword || undefined, limit: 8 });
        if (!active) return;
        setWarehouseOptions(response.data ?? []);
      } catch {
        if (!active) return;
        setWarehouseOptions([]);
      } finally {
        if (active) {
          setWarehouseLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [warehouseQuery, formOpen]);

  useEffect(() => {
    if (!formOpen) return;

    const warehouseId = formState.warehouse_id.trim();
    if (!warehouseId || !isUuid(warehouseId)) {
      setPickupLocations([]);
      setPickupLoading(false);
      return;
    }

    let active = true;
    const fetchLocations = async () => {
      try {
        setPickupLoading(true);
        const locations = await warehouseService.getLocations(warehouseId);
        if (!active) return;
        setPickupLocations(locations.filter((location) => location.is_active));
      } catch {
        if (!active) return;
        setPickupLocations([]);
      } finally {
        if (active) {
          setPickupLoading(false);
        }
      }
    };

    void fetchLocations();
    return () => {
      active = false;
    };
  }, [formState.warehouse_id, formOpen]);

  const customerLabel = (customer: CustomerLookupItem) => {
    const contact = customer.phone || customer.email || 'No contact';
    return `${customer.full_name} (${contact})`;
  };

  const variantLabel = (variant: VariantLookupItem) => {
    const identifier = variant.internal_barcode || variant.isbn || variant.sku;
    return `${variant.title} (${identifier})`;
  };

  const warehouseLabel = (warehouse: WarehouseLookupItem) => `${warehouse.name} (${warehouse.code})`;

  const pickupLabel = (location: WarehouseLocation) => {
    const segments = [location.location_code, location.zone, location.aisle, location.shelf, location.bin].filter(Boolean);
    return segments.join(' • ');
  };

  const filteredPickupLocations = useMemo(() => {
    const keyword = pickupQuery.trim().toLowerCase();
    const source = pickupLocations.slice(0, 30);

    if (!keyword || isUuid(pickupQuery)) {
      return source.slice(0, 8);
    }

    return source
      .filter((location) => {
        const searchable = [location.location_code, location.zone, location.aisle, location.shelf, location.bin]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(keyword);
      })
      .slice(0, 8);
  }, [pickupLocations, pickupQuery]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return reservations.filter((reservation) => {
      if (statusFilter !== 'ALL' && reservation.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        reservation.reservation_number.toLowerCase().includes(keyword)
        || reservation.variant_id.toLowerCase().includes(keyword)
        || reservation.customers?.full_name.toLowerCase().includes(keyword)
      );
    });
  }, [reservations, query, statusFilter]);

  const submitReservation = async () => {
    if (!formState.customer_id || !formState.variant_id || !formState.warehouse_id) {
      toast.error('Customer, variant_id and warehouse_id are required');
      return;
    }

    const qty = Number.parseInt(formState.quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error('Quantity must be a positive integer');
      return;
    }

    try {
      setSaving(true);
      await borrowService.createReservation({
        customer_id: formState.customer_id.trim(),
        variant_id: formState.variant_id.trim(),
        warehouse_id: formState.warehouse_id.trim(),
        pickup_location_id: formState.pickup_location_id.trim() || undefined,
        quantity: qty,
        source_channel: formState.source_channel,
        notes: formState.notes.trim() || undefined,
      });
      toast.success('Reservation created successfully');
      setFormOpen(false);
      setFormState(initialFormState);
      await loadReservations();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create reservation'));
    } finally {
      setSaving(false);
    }
  };

  const cancelReservation = async (id: string) => {
    if (!window.confirm('Cancel this reservation?')) return;

    try {
      await borrowService.cancelReservation(id);
      toast.success('Reservation cancelled');
      await loadReservations();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to cancel reservation'));
    }
  };

  const convertReservation = async (id: string) => {
    if (!window.confirm('Convert this reservation to loan now?')) return;

    try {
      await borrowService.convertReservationToLoan(id);
      toast.success('Reservation converted to loan');
      await loadReservations();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to convert reservation'));
    }
  };

  return (
    <PageWrapper className="space-y-5">
      <FadeItem>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="tracking-[-0.02em]">Borrow Reservations</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{reservations.length} reservations</p>
          </div>
          <button
            onClick={() => {
              setFormOpen(true);
              setFormState(initialFormState);
              setCustomerQuery('');
              setCustomerOptions([]);
              setVariantQuery('');
              setVariantOptions([]);
              setWarehouseQuery('');
              setWarehouseOptions([]);
              setPickupQuery('');
              setPickupLocations([]);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[13px] shadow-md shadow-rose-500/15 hover:shadow-lg transition-all"
            style={{ fontWeight: 550 }}
          >
            <Plus className="w-4 h-4" /> New Reservation
          </button>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reservation..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-rose-100/60 rounded-[10px] text-[13px] outline-none focus:ring-[3px] focus:ring-rose-500/10 focus:border-rose-300/60 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200/60 rounded-[10px] p-[3px] shadow-sm overflow-x-auto">
            {(['ALL', ...statuses] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`relative px-3.5 py-1.5 rounded-[8px] text-[12px] whitespace-nowrap transition-all duration-160 ${statusFilter === status ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                style={{ fontWeight: 550 }}
              >
                {statusFilter === status && (
                  <motion.div
                    layoutId="reservation-filter"
                    className="absolute inset-0 rounded-[8px] bg-gradient-to-r from-rose-600 to-pink-600 shadow-sm"
                    transition={{ duration: 0.22 }}
                  />
                )}
                <span className="relative z-10">{status}</span>
              </button>
            ))}
          </div>
        </div>
      </FadeItem>

      <FadeItem>
        <div className="bg-white rounded-[16px] border border-white/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-rose-50/40 to-transparent">
                {['No.', 'Customer', 'Variant', 'Warehouse', 'Qty', 'Expires At', 'Status', 'Action'].map((header) => (
                  <th key={header} className="text-left text-[11px] text-slate-400 px-5 py-3 uppercase tracking-[0.05em]" style={{ fontWeight: 550 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-[13px] text-slate-400">
                    <LoaderCircle className="w-4 h-4 inline mr-2 animate-spin" /> Loading reservations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-[13px] text-slate-400">No reservations found</td>
                </tr>
              ) : (
                filtered.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-slate-50 last:border-0 hover:bg-rose-50/20 transition-all">
                    <td className="px-5 py-3.5 text-[13px]" style={{ fontWeight: 550 }}>{reservation.reservation_number}</td>
                    <td className="px-5 py-3.5 text-[13px]">{reservation.customers?.full_name || reservation.customer_id}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{reservation.variant_id}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{reservation.warehouse_id}</td>
                    <td className="px-5 py-3.5 text-[13px]">{reservation.quantity}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{new Date(reservation.expires_at).toLocaleString('vi-VN')}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={reservation.status} variant={getVariant(reservation.status)} dot />
                    </td>
                    <td className="px-5 py-3.5">
                      {['PENDING', 'CONFIRMED', 'READY_FOR_PICKUP'].includes(reservation.status) ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void convertReservation(reservation.id)}
                            className="px-2.5 py-1 rounded-[6px] border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] hover:bg-emerald-100 transition-all"
                            style={{ fontWeight: 550 }}
                          >
                            Convert
                          </button>
                          <button
                            onClick={() => void cancelReservation(reservation.id)}
                            className="px-2.5 py-1 rounded-[6px] border border-amber-200 bg-amber-50 text-amber-700 text-[11px] hover:bg-amber-100 transition-all"
                            style={{ fontWeight: 550 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeItem>

      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-[16px] p-6 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-[16px] mb-4" style={{ fontWeight: 650 }}>New Reservation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <label className="text-[12px] text-slate-600 md:col-span-2" style={{ fontWeight: 550 }}>
                  Customer (phone, name, email)*
                  <div className="relative mt-1">
                    <input
                      value={customerQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setCustomerQuery(value);
                        if (!value.trim()) {
                          setFormState((prev) => ({ ...prev, customer_id: '' }));
                        }
                      }}
                      placeholder="Type phone/name/email to search customer"
                      className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                    />

                    {(customerLoading || customerOptions.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full rounded-[8px] border border-slate-200 bg-white shadow-lg max-h-52 overflow-auto">
                        {customerLoading ? (
                          <p className="px-3 py-2 text-[12px] text-slate-500">Searching customers...</p>
                        ) : (
                          customerOptions.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => {
                                setFormState((prev) => ({ ...prev, customer_id: customer.id }));
                                setCustomerQuery(customerLabel(customer));
                                setCustomerOptions([]);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-rose-50 transition-colors"
                            >
                              <p className="text-[12px] text-slate-800" style={{ fontWeight: 550 }}>{customer.full_name}</p>
                              <p className="text-[11px] text-slate-500">{customer.phone || customer.email || 'No contact'} • {customer.customer_code}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formState.customer_id ? `Selected customer ID: ${formState.customer_id}` : 'Please select a customer from suggestions'}
                  </p>
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Variant (title / ISBN / barcode)*
                  <div className="relative mt-1">
                    <input
                      value={variantQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setVariantQuery(value);
                        if (!value.trim()) {
                          setFormState((prev) => ({ ...prev, variant_id: '' }));
                          return;
                        }
                        if (isUuid(value)) {
                          setFormState((prev) => ({ ...prev, variant_id: value.trim() }));
                          setVariantOptions([]);
                        } else {
                          setFormState((prev) => ({ ...prev, variant_id: '' }));
                        }
                      }}
                      placeholder="Type title / ISBN / barcode"
                      className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                    />

                    {(variantLoading || variantOptions.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full rounded-[8px] border border-slate-200 bg-white shadow-lg max-h-52 overflow-auto">
                        {variantLoading ? (
                          <p className="px-3 py-2 text-[12px] text-slate-500">Searching variants...</p>
                        ) : (
                          variantOptions.map((variant) => {
                            const identifier = variant.internal_barcode || variant.isbn || variant.sku;
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                onClick={() => {
                                  setFormState((prev) => ({ ...prev, variant_id: variant.id }));
                                  setVariantQuery(variantLabel(variant));
                                  setVariantOptions([]);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-rose-50 transition-colors"
                              >
                                <p className="text-[12px] text-slate-800" style={{ fontWeight: 550 }}>{variant.title}</p>
                                <p className="text-[11px] text-slate-500">{identifier} • {variant.sku}</p>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formState.variant_id ? `Selected variant ID: ${formState.variant_id}` : 'Please select a variant from suggestions'}
                  </p>
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Warehouse (name / code)*
                  <div className="relative mt-1">
                    <input
                      value={warehouseQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setWarehouseQuery(value);
                        if (!value.trim()) {
                          setFormState((prev) => ({ ...prev, warehouse_id: '', pickup_location_id: '' }));
                          setPickupQuery('');
                          setPickupLocations([]);
                          return;
                        }
                        if (isUuid(value)) {
                          setFormState((prev) => ({ ...prev, warehouse_id: value.trim(), pickup_location_id: '' }));
                          setPickupQuery('');
                          setWarehouseOptions([]);
                        } else {
                          setFormState((prev) => ({ ...prev, warehouse_id: '', pickup_location_id: '' }));
                          setPickupQuery('');
                        }
                      }}
                      placeholder="Type warehouse name/code"
                      className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300"
                    />

                    {(warehouseLoading || warehouseOptions.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full rounded-[8px] border border-slate-200 bg-white shadow-lg max-h-52 overflow-auto">
                        {warehouseLoading ? (
                          <p className="px-3 py-2 text-[12px] text-slate-500">Loading warehouses...</p>
                        ) : (
                          warehouseOptions.map((warehouse) => (
                            <button
                              key={warehouse.id}
                              type="button"
                              onClick={() => {
                                setFormState((prev) => ({ ...prev, warehouse_id: warehouse.id, pickup_location_id: '' }));
                                setWarehouseQuery(warehouseLabel(warehouse));
                                setWarehouseOptions([]);
                                setPickupQuery('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-rose-50 transition-colors"
                            >
                              <p className="text-[12px] text-slate-800" style={{ fontWeight: 550 }}>{warehouse.name}</p>
                              <p className="text-[11px] text-slate-500">{warehouse.code} • {warehouse.warehouse_type}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formState.warehouse_id ? `Selected warehouse ID: ${formState.warehouse_id}` : 'Please select a warehouse from suggestions'}
                  </p>
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Pickup location (code / zone)
                  <div className="relative mt-1">
                    <input
                      value={pickupQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setPickupQuery(value);
                        if (!value.trim()) {
                          setFormState((prev) => ({ ...prev, pickup_location_id: '' }));
                          return;
                        }
                        if (isUuid(value)) {
                          setFormState((prev) => ({ ...prev, pickup_location_id: value.trim() }));
                        } else {
                          setFormState((prev) => ({ ...prev, pickup_location_id: '' }));
                        }
                      }}
                      disabled={!formState.warehouse_id}
                      placeholder={formState.warehouse_id ? 'Type location code/zone' : 'Select warehouse first'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300 disabled:bg-slate-50 disabled:text-slate-400"
                    />

                    {(pickupLoading || (formState.warehouse_id && filteredPickupLocations.length > 0)) && (
                      <div className="absolute z-20 mt-1 w-full rounded-[8px] border border-slate-200 bg-white shadow-lg max-h-52 overflow-auto">
                        {pickupLoading ? (
                          <p className="px-3 py-2 text-[12px] text-slate-500">Loading pickup locations...</p>
                        ) : (
                          filteredPickupLocations.map((location) => (
                            <button
                              key={location.id}
                              type="button"
                              onClick={() => {
                                setFormState((prev) => ({ ...prev, pickup_location_id: location.id }));
                                setPickupQuery(pickupLabel(location));
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-rose-50 transition-colors"
                            >
                              <p className="text-[12px] text-slate-800" style={{ fontWeight: 550 }}>{location.location_code}</p>
                              <p className="text-[11px] text-slate-500">{[location.zone, location.aisle, location.shelf, location.bin].filter(Boolean).join(' • ') || location.location_type}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formState.pickup_location_id ? `Selected pickup location ID: ${formState.pickup_location_id}` : 'Optional: choose pickup location from this warehouse'}
                  </p>
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Quantity
                  <input type="number" min={1} value={formState.quantity} onChange={(event) => setFormState((prev) => ({ ...prev, quantity: event.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300" />
                </label>
                <label className="text-[12px] text-slate-600" style={{ fontWeight: 550 }}>
                  Source
                  <select value={formState.source_channel} onChange={(event) => setFormState((prev) => ({ ...prev, source_channel: event.target.value as ReservationSource }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300">
                    {(['WEB', 'MOBILE', 'COUNTER', 'ADMIN'] as const).map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </label>
                <label className="text-[12px] text-slate-600 md:col-span-2" style={{ fontWeight: 550 }}>
                  Notes
                  <textarea rows={2} value={formState.notes} onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:ring-[2px] focus:ring-rose-500/15 focus:border-rose-300" />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-700 text-[13px] hover:bg-slate-50" style={{ fontWeight: 550 }}>
                  Cancel
                </button>
                <button
                  onClick={() => void submitReservation()}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[13px] shadow-md disabled:opacity-60"
                  style={{ fontWeight: 550 }}
                >
                  {saving ? 'Saving...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
