import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { PrivateRoute } from './components/ui/PrivateRoute'

// Auth
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Shared dashboard
import { DashboardPage } from './pages/DashboardPage'

// Buyer
import { NewRequestPage } from './pages/buyer/NewRequestPage'
import { RequestDetailPage } from './pages/buyer/RequestDetailPage'
import { ProcurementPage } from './pages/buyer/ProcurementPage'

// Supplier
import { SalesPage } from './pages/supplier/SalesPage'
import { OpportunityDetailPage } from './pages/supplier/OpportunityDetailPage'
import { CatalogPage } from './pages/supplier/CatalogPage'

// Shared
import { OrdersListPage } from './pages/OrdersListPage'
import { OrderDetailPage } from './pages/OrderDetailPage'

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated shell */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute roles={['BUYER', 'SUPPLIER', 'ADMIN']}>
                  <AppLayout><DashboardPage /></AppLayout>
                </PrivateRoute>
              }
            />

            {/* Buyer */}
            <Route
              path="/requests"
              element={
                <PrivateRoute roles={['BUYER']}>
                  <AppLayout><ProcurementPage /></AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/new"
              element={
                <PrivateRoute roles={['BUYER']}>
                  <AppLayout><NewRequestPage /></AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <PrivateRoute roles={['BUYER']}>
                  <AppLayout><RequestDetailPage /></AppLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/sales"
              element={
                <PrivateRoute roles={['SUPPLIER']}>
                  <AppLayout><SalesPage /></AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/opportunities/:id"
              element={
                <PrivateRoute roles={['SUPPLIER']}>
                  <AppLayout><OpportunityDetailPage /></AppLayout>
                </PrivateRoute>
              }
            />
            <Route path="/opportunities" element={<Navigate to="/sales?tab=opportunities" replace />} />
            <Route path="/proposals" element={<Navigate to="/sales?tab=proposals" replace />} />

            <Route
              path="/catalog"
              element={
                <PrivateRoute roles={['SUPPLIER']}>
                  <AppLayout><CatalogPage /></AppLayout>
                </PrivateRoute>
              }
            />

            {/* Shared Orders */}
            <Route
              path="/orders"
              element={
                <PrivateRoute roles={['BUYER', 'SUPPLIER']}>
                   {/* We'll handle internal role check in the layout/sidebar, but here we redirect buyer to unified tab */}
                   <AppLayout>
                     <OrdersRedirectWrapper />
                   </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <PrivateRoute roles={['BUYER', 'SUPPLIER']}>
                  <AppLayout><OrderDetailPage /></AppLayout>
                </PrivateRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminLayout><AdminDashboard /></AdminLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminLayout><AdminUsersPage /></AdminLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminLayout><AdminRequestsPage /></AdminLayout>
                </PrivateRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
function OrdersRedirectWrapper() {
  const { user } = useAuth()
  if (user?.role === 'BUYER') return <Navigate to="/requests?tab=orders" replace />
  if (user?.role === 'SUPPLIER') return <Navigate to="/sales?tab=orders" replace />
  return <OrdersListPage />
}
