export interface User {
  id: string
  name: string
  email: string
  role: 'BUYER' | 'SUPPLIER' | 'ADMIN'
  companyId: string | null
  company?: Company | null
}

export interface Company {
  id: string
  name: string
  cnpj: string
  role: 'BUYER' | 'SUPPLIER' | 'ADMIN'
  phone?: string
  email?: string
  active: boolean
}

export interface Address {
  id: string
  companyId: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isMain: boolean
  latitude?: number
  longitude?: number
}

export interface Product {
  id: string
  name: string
  sku: string
  description?: string
  unit: string
  weightKg: number
}

export type BuyerRequestStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'AWARDED'
  | 'CANCELLED'
  | 'EXPIRED'

export type ProposalStatus =
  | 'SUBMITTED'
  | 'UPDATED'
  | 'WITHDRAWN'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTER_OFFER'

export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export interface BuyerRequestItem {
  id: string
  buyerRequestId: string
  productId: string
  quantity: number
  product: Product
}

export interface BuyerRequest {
  id: string
  buyerCompanyId: string
  addressId: string
  deadline: string
  expiresAt: string
  observations?: string
  status: BuyerRequestStatus
  createdAt: string
  items: BuyerRequestItem[]
  address?: Address
  buyerCompany?: Pick<Company, 'id' | 'name'>
  proposals?: SupplierProposal[]
  _count?: { proposals: number }
  distanceKm?: number | null
  lowestMarketSummary?: {
    totalPrice: number
    freightPrice: number
    isMyProposal: boolean
    items: Array<{
      productId: string
      productName: string
      quantity: number
      unitPrice: number
      subtotal: number
    }>
  } | null
}

export interface SupplierProposalItem {
  id: string
  supplierProposalId: string
  buyerRequestItemId: string
  unitPrice: number
  buyerRequestItem?: BuyerRequestItem
}

export interface SupplierProposal {
  id: string
  buyerRequestId: string
  supplierCompanyId: string
  freightPrice: number
  deliveryDeadline: string
  paymentTerms?: string
  observations?: string
  status: ProposalStatus
  createdAt: string
  items: SupplierProposalItem[]
  supplierCompany?: Pick<Company, 'id' | 'name' | 'cnpj'>
  buyerRequest?: BuyerRequest
}

export interface Order {
  id: string
  buyerRequestId: string
  proposalId: string
  buyerCompanyId: string
  supplierCompanyId: string
  status: OrderStatus
  totalPrice: number
  createdAt: string
  confirmedAt?: string
  deliveredAt?: string
  buyerRequest?: BuyerRequest
  proposal?: SupplierProposal
  buyerCompany?: Pick<Company, 'id' | 'name'>
  supplierCompany?: Pick<Company, 'id' | 'name'>
  timeline?: OrderTimeline[]
}

export interface OrderTimeline {
  id: string
  orderId: string
  status: OrderStatus
  notes?: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface AdminMetrics {
  kpis: {
    totalUsers: number
    totalCompanies: number
    totalRequests: number
    totalOrders: number
    openRequests: number
    deliveredOrders: number
    totalRevenue: number
  }
  recentRequests: BuyerRequest[]
  recentOrders: Order[]
}
