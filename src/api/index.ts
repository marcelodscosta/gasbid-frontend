import { api } from '../lib/axios'
import type {
  BuyerRequest,
  SupplierProposal,
  Order,
  Product,
  Address,
  AdminMetrics,
  PaginatedResponse,
} from '../types'

// Auth
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data).then(r => r.data),
  login: (email: string, password: string) =>
    api.post<{ token: string; refreshToken: string; user: unknown }>('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/me').then(r => r.data),
}

// Products
export const productsApi = {
  list: () => api.get<Product[]>('/products').then(r => r.data),
}

// Addresses
export const addressesApi = {
  list: (companyId: string) =>
    api.get<Address[]>(`/companies/${companyId}/addresses`).then(r => r.data),
  create: (companyId: string, data: Record<string, unknown>) =>
    api.post<Address>(`/companies/${companyId}/addresses`, data).then(r => r.data),
}

// Buyer Requests
export const buyerRequestsApi = {
  create: (data: Record<string, unknown>) =>
    api.post<BuyerRequest>('/buyer-requests', data).then(r => r.data),
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<BuyerRequest>>('/buyer-requests', { params }).then(r => r.data),
  get: (id: string) =>
    api.get<BuyerRequest>(`/buyer-requests/${id}`).then(r => r.data),
  cancel: (id: string) =>
    api.post(`/buyer-requests/${id}/cancel`).then(r => r.data),
}

// Opportunities (Supplier)
export const opportunitiesApi = {
  list: (params?: { page?: number; limit?: number; showApplied?: boolean }) =>
    api.get<PaginatedResponse<BuyerRequest>>('/marketplace/opportunities', { params }).then(r => r.data),
  metrics: () =>
    api.get<{
      openOpportunities: number;
      competingOpportunities: number;
      ordersWon: number;
      pendingDeliveries: number;
      recentActivity: any[];
      averagePrices: any[];
      reputation?: {
        averageStars: number | null;
        ratingCount: number;
        ratings: Array<{ stars: number; comment?: string; createdAt: string }>;
      };
    }>('/marketplace/metrics').then(r => r.data),
}

// Proposals
export const proposalsApi = {
  listMyProposals: () =>
    api.get<SupplierProposal[]>('/my-proposals').then(r => r.data),
  create: (requestId: string, data: Record<string, unknown>) =>
    api.post<SupplierProposal>(`/buyer-requests/${requestId}/proposals`, data).then(r => r.data),
  list: (requestId: string) =>
    api.get<SupplierProposal[]>(`/buyer-requests/${requestId}/proposals`).then(r => r.data),
  accept: (proposalId: string) =>
    api.post<Order>(`/proposals/${proposalId}/accept`).then(r => r.data),
  reject: (proposalId: string) =>
    api.post(`/proposals/${proposalId}/reject`).then(r => r.data),
  counterOffer: (proposalId: string, notes: string) =>
    api.post(`/proposals/${proposalId}/counter`, { notes }).then(r => r.data),
}

// Orders
export const ordersApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Order>>('/orders', { params }).then(r => r.data),
  get: (id: string) =>
    api.get<Order>(`/orders/${id}`).then(r => r.data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status, notes }).then(r => r.data),
  getMessages: (id: string) =>
    api.get<any[]>(`/orders/${id}/messages`).then(r => r.data),
  sendMessage: (id: string, content: string) =>
    api.post<any>(`/orders/${id}/messages`, { content }).then(r => r.data),
  rate: (id: string, stars: number, comment?: string) =>
    api.post(`/orders/${id}/rate`, { stars, comment }).then(r => r.data),
  tracking: (id: string) =>
    api.get<{
      orderId: string
      trackingEnabled: boolean
      online: boolean
      location: { latitude: number; longitude: number; heading?: number | null; speed?: number | null; updatedAt: string } | null
    }>(`/orders/${id}/tracking`).then(r => r.data),
}

// Tracking (Supplier)
export const trackingApi = {
  setEnabled: (enabled: boolean) =>
    api.put<{ id: string; trackingEnabled: boolean }>('/tracking/settings', { enabled }).then(r => r.data),
}

// Admin
export const adminApi = {
  metrics: () => api.get<AdminMetrics>('/admin/metrics').then(r => r.data),
  users: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/users', { params }).then(r => r.data),
  requests: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/requests', { params }).then(r => r.data),
  getSettings: () => api.get<{ proposalWindowMinutes: number }>('/admin/settings').then(r => r.data),
  updateSettings: (proposalWindowMinutes: number) =>
    api.put<{ proposalWindowMinutes: number }>('/admin/settings', { proposalWindowMinutes }).then(r => r.data),
  listGlobalProducts: () => api.get<Product[]>('/admin/products').then(r => r.data),
  listSupplierProducts: (supplierId: string) => api.get<any[]>(`/admin/suppliers/${supplierId}/products`).then(r => r.data),
  addSupplierProduct: (supplierId: string, productId: string) => api.post<any>(`/admin/suppliers/${supplierId}/products`, { productId }).then(r => r.data),
  updateSupplierProduct: (supplierProductId: string, data: any) => api.put<any>(`/admin/supplier-products/${supplierProductId}`, data).then(r => r.data),
  removeSupplierProduct: (supplierProductId: string) => api.delete(`/admin/supplier-products/${supplierProductId}`).then(r => r.data),
}

// Supplier Products
export const supplierProductsApi = {
  listMyProducts: () => api.get<any[]>('/supplier/products').then(r => r.data),
  updateProduct: (supplierProductId: string, data: any) => api.put<any>(`/supplier/products/${supplierProductId}`, data).then(r => r.data),
}

// Settings (leitura pública para usuários autenticados)
export const settingsApi = {
  proposalWindow: () =>
    api.get<{ proposalWindowMinutes: number }>('/settings/proposal-window').then(r => r.data),
}
