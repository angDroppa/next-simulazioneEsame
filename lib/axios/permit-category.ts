// api/permit-category.api.ts
import api from './index'

export interface PermitCategory {
  categoryName: string
}

export const permitCategoryApi = {
  getAll: async (): Promise<PermitCategory[]> => {
    const response = await api.get<PermitCategory[]>('/permit-category')
    return response.data
  },
}