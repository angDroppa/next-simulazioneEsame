// api/permit.api.ts
import api from './index'
import { Permit, CreatePermit } from '@/lib/schemas/permit.schema'

export const permitApi = {
  getAll: async (): Promise<Permit[]> => {
    const response = await api.get<Permit[]>('/permit')
    return response.data
  },

  getById: async (id: number): Promise<Permit> => {
    const response = await api.get<Permit>(`/permit/${id}`)
    return response.data
  },

  create: async (data: CreatePermit): Promise<Permit> => {
    const response = await api.post<Permit>('/permit', data)
    return response.data
  },

  update: async (id: number, data: CreatePermit): Promise<Permit> => {
    const response = await api.put<Permit>(`/permit/${id}`, data)
    return response.data
  },

  evaluate: async (id: number, state: boolean): Promise<Permit> => {
    const response = await api.patch<Permit>(`/permit/${id}`, { state })
    return response.data
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/permit/${id}`)
  },
}