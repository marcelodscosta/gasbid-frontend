import type { BuyerRequestStatus, ProposalStatus, OrderStatus } from '../types'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function requestStatusLabel(status: BuyerRequestStatus) {
  const map: Record<BuyerRequestStatus, string> = {
    DRAFT: 'Rascunho', OPEN: 'Aberta', UNDER_REVIEW: 'Em análise',
    AWARDED: 'Atribuída', CANCELLED: 'Cancelada', EXPIRED: 'Expirada',
  }
  return map[status] ?? status
}

export function requestStatusBadge(status: BuyerRequestStatus) {
  const map: Record<BuyerRequestStatus, string> = {
    DRAFT: 'badge-gray', OPEN: 'badge-green', UNDER_REVIEW: 'badge-blue',
    AWARDED: 'badge-orange', CANCELLED: 'badge-red', EXPIRED: 'badge-yellow',
  }
  return map[status] ?? 'badge-gray'
}

export function proposalStatusLabel(status: ProposalStatus) {
  const map: Record<ProposalStatus, string> = {
    SUBMITTED: 'Enviada', UPDATED: 'Atualizada', WITHDRAWN: 'Retirada',
    ACCEPTED: 'Aceita', REJECTED: 'Rejeitada',
    COUNTER_OFFER: 'Contraproposta',
  }
  return map[status] ?? status
}

export function proposalStatusBadge(status: ProposalStatus) {
  const map: Record<ProposalStatus, string> = {
    SUBMITTED: 'badge-blue', UPDATED: 'badge-yellow', WITHDRAWN: 'badge-gray',
    ACCEPTED: 'badge-green', REJECTED: 'badge-red',
    COUNTER_OFFER: 'badge-orange',
  }
  return map[status] ?? 'badge-gray'
}

export function orderStatusLabel(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    PENDING_CONFIRMATION: 'Aguardando Seu Aceite',
    CREATED: 'Criado', CONFIRMED: 'Confirmado', IN_DELIVERY: 'Em entrega',
    DELIVERED: 'Entregue', CANCELLED: 'Cancelado',
  }
  return map[status] ?? status
}

export function orderStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    PENDING_CONFIRMATION: 'badge-red',
    CREATED: 'badge-blue', CONFIRMED: 'badge-orange', IN_DELIVERY: 'badge-yellow',
    DELIVERED: 'badge-green', CANCELLED: 'badge-red',
  }
  return map[status] ?? 'badge-gray'
}

export function maskCurrency(value: string | number) {
  let v = typeof value === 'number' ? value.toFixed(2).replace(/\D/g, '') : String(value).replace(/\D/g, '')
  if (v === '') v = '0'
  
  return (Number(v) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function parseCurrency(value: string) {
  return Number(value.replace(/\D/g, '')) / 100
}

export function mantineBadgeColor(badgeClass: string): string {
  if (badgeClass.includes('green')) return 'teal';
  if (badgeClass.includes('orange')) return 'orange';
  if (badgeClass.includes('red')) return 'red';
  if (badgeClass.includes('yellow')) return 'yellow';
  if (badgeClass.includes('blue')) return 'blue';
  return 'gray';
}
