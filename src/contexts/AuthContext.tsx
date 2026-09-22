import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api'
import type { User } from '../types'

interface AuthContextData {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('@gasbid:token')
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('@gasbid:token')
          localStorage.removeItem('@gasbid:refresh')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])


  async function login(email: string, password: string) {
    const { token, refreshToken, user: userData } = await authApi.login(email, password)
    localStorage.setItem('@gasbid:token', token)
    localStorage.setItem('@gasbid:refresh', refreshToken)
    setUser(userData as User)
  }

  function logout() {
    localStorage.removeItem('@gasbid:token')
    localStorage.removeItem('@gasbid:refresh')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
