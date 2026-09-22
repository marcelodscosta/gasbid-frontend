import React from 'react'
import { render, screen } from '@testing-library/react'
import { BuyerDashboard } from './BuyerDashboard'
import { vi, describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mocks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'João Comprador', company: { name: 'Restaurante Sabor' } }
  })
}))

vi.mock('../../api', () => ({
  buyerRequestsApi: {
    list: vi.fn().mockResolvedValue({ data: [], total: 0 })
  },
  ordersApi: {
    list: vi.fn().mockResolvedValue({ data: [], total: 0 })
  }
}))

// Mock do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('BuyerDashboard', () => {
  it('deve renderizar a saudação ao usuário', () => {
    renderWithProviders(<BuyerDashboard />)
    expect(screen.getByText(/Olá, João/i)).toBeInTheDocument()
  })

  it('deve mostrar mensagem de aguardando dados na inteligência de preços quando não houver pedidos', () => {
    renderWithProviders(<BuyerDashboard />)
    expect(screen.getByText(/Aguardando o primeiro pedido para calcular estatísticas de preço/i)).toBeInTheDocument()
  })

  it('deve mostrar estado vazio para solicitações recentes', () => {
    renderWithProviders(<BuyerDashboard />)
    expect(screen.getByText(/Nenhuma solicitação/i)).toBeInTheDocument()
  })
})
