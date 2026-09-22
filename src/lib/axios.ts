import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://gasbid-backend-zh4b.onrender.com',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@gasbid:token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('@gasbid:refresh')
        if (!refreshToken) throw new Error('No refresh token available')

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'https://gasbid-backend-zh4b.onrender.com'}/auth/refresh`,
          { refreshToken },
        )
        localStorage.setItem('@gasbid:token', data.token)
        localStorage.setItem('@gasbid:refresh', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.token}`
        return api(original)
      } catch {
        localStorage.removeItem('@gasbid:token')
        localStorage.removeItem('@gasbid:refresh')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
