import { inventoryAPI } from './api.ts';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  warehouse_type: string;
  address_line1: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    locations: number;
  };
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  parent_location_id: string | null;
  location_code: string;
  location_type: string;
  zone: string | null;
  aisle: string | null;
  shelf: string | null;
  bin: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseCreateRequest {
  name: string;
  code: string;
  warehouse_type?: string;
  address_line1?: string;
}

export const warehouseService = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await inventoryAPI.get('/api/warehouses', { params });
    return (response.data || []) as Warehouse[];
  },

  getById: async (id: string) => {
    const response = await inventoryAPI.get(`/api/warehouses/${id}`);
    return response.data as Warehouse;
  },

  create: async (data: WarehouseCreateRequest) => {
    const response = await inventoryAPI.post('/api/warehouses', data);
    return response.data as Warehouse;
  },

  update: async (id: string, data: Partial<WarehouseCreateRequest>) => {
    const response = await inventoryAPI.put(`/api/warehouses/${id}`, data);
    return response.data as Warehouse;
  },

  delete: async (id: string) => {
    await inventoryAPI.delete(`/api/warehouses/${id}`);
  },

  getLocations: async (id: string) => {
    const response = await inventoryAPI.get(`/api/warehouses/${id}/locations`);
    return (response.data?.locations || []) as WarehouseLocation[];
  },
};
