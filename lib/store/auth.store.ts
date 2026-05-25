import { create } from 'zustand'

const ACCESS_TOKEN_MAX_AGE = 900        // 15 minuti in secondi
const REFRESH_TOKEN_MAX_AGE = 604800    // 7 giorni in secondi

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; SameSite=Strict; max-age=${maxAge}`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`
}

/**
 * Legge un valore dal localStorage, restituendo null se assente o corrotto
 * (es. la stringa "undefined" che può essere scritta accidentalmente)
 */
function getStoredToken(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const val = localStorage.getItem(key)
    return val && val !== 'undefined' && val !== 'null' ? val : null
  } catch {
    return null
  }
}

function getUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem('user')
    if (!item || item === 'undefined' || item === 'null') return null
    return JSON.parse(item)
  } catch {
    return null
  }
}

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  roleName: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  setTokens: (accessToken: string, refreshToken: string, user: User) => void
  clearTokens: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getStoredToken('accessToken'),
  refreshToken: getStoredToken('refreshToken'),
  user: getUser(),

  setTokens: (accessToken, refreshToken, user) => {
    // localStorage — usato dall'interceptor axios lato client
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    // Cookie — letti dal middleware Next.js lato server
    setCookie('accessToken', accessToken, ACCESS_TOKEN_MAX_AGE)
    setCookie('refreshToken', refreshToken, REFRESH_TOKEN_MAX_AGE)
    set({ accessToken, refreshToken, user })
  },

  clearTokens: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    deleteCookie('accessToken')
    deleteCookie('refreshToken')
    set({ accessToken: null, refreshToken: null, user: null })
  },
}))