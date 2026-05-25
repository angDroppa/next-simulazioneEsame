import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth.store'
import { useLoadingStore } from '../store/loading.store'

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  silent?: boolean
  successMessage?: string
  _retry?: boolean
}

interface ErrorResponseData {
  error?: string
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  useLoadingStore.getState().start()
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Refresh token queue ──────────────────────────────────────────────────────

let isRefreshing = false
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

// ─── Error messages ───────────────────────────────────────────────────────────

const getErrorMessage = (error: AxiosError<ErrorResponseData>): string => {
  const status = error.response?.status
  switch (status) {
    case 400: return 'Dati non validi.'
    case 401: return 'Credenziali non valide.'
    case 403: return 'Accesso negato.'
    case 404: return 'Risorsa non trovata.'
    case 409: return 'Risorsa già esistente.'
    case 422: return 'Dati non processabili.'
    case 500: return 'Errore del server. Riprova più tardi.'
    default:  return 'Qualcosa è andato storto.'
  }
}

// ─── Response interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (res) => {
    useLoadingStore.getState().stop()
    const config = res.config as CustomAxiosRequestConfig
    if (config.successMessage && !config.silent) toast.success(config.successMessage)
    return res
  },
  async (error: AxiosError<ErrorResponseData>) => {
    useLoadingStore.getState().stop()

    const original = error.config as CustomAxiosRequestConfig

    // ── Gestione 401 con tentativo di refresh ──────────────────────────────
    if (error.response?.status === 401 && !original._retry) {

      // Per le rotte di autenticazione non tentiamo il refresh
      const isAuthRoute = original.url?.includes('/auth/')
      if (isAuthRoute) {
        if (!original.silent) toast.error(getErrorMessage(error))
        return Promise.reject(error)
      }

      // Se è già in corso un refresh, metti la richiesta in coda
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true

      const { refreshToken, setTokens, clearTokens } = useAuthStore.getState()

      // Se non c'è un refresh token valido, non tentare nemmeno la chiamata
      if (!refreshToken) {
        isRefreshing = false
        processQueue(new Error('No refresh token'), null)
        clearTokens()
        if (!original.silent) toast.error('Sessione scaduta. Effettua di nuovo il login.')
        return Promise.reject(error)
      }

      try {
        // Il server restituisce accessToken, refreshToken (rotation) e user
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })

        setTokens(data.accessToken, data.refreshToken, data.user)
        processQueue(null, data.accessToken)

        if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        clearTokens()
        if (!original.silent) toast.error('Sessione scaduta. Effettua di nuovo il login.')
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // ── Tutti gli altri errori ─────────────────────────────────────────────
    if (!original?.silent) toast.error(getErrorMessage(error))
    return Promise.reject(error)
  }
)

export default api