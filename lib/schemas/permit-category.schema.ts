import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const PermitCategorySchema = z.object({
  categoryName: z.string().openapi({ example: 'FERIE' }),
})

export type PermitCategory = z.infer<typeof PermitCategorySchema>

