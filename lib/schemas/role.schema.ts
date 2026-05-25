import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const RoleSchema = z.object({
  role: z.string().openapi({ example: 'DIPENDENTE' }),
})