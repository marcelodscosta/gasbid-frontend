import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  roles?: string[]
}

export function PrivateRoute({ children, roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Carregando...</span>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
