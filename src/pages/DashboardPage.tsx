import { useAuth } from '../contexts/AuthContext'
import { BuyerDashboard } from './buyer/BuyerDashboard'
import { SupplierDashboard } from './supplier/SupplierDashboard'

import { Navigate } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user?.role === 'SUPPLIER') return <SupplierDashboard />
  return <BuyerDashboard />
}
