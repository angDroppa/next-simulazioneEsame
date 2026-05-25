import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const UserSchema = z.object({
  id: z.number().openapi({ example: 1 }),

  firstName: z.string().openapi({ example: 'Mario' }),
  lastName: z.string().openapi({ example: 'Rossi' }),

  email: z.string().email().openapi({ example: 'mario@example.com' }),

  roleName: z.string().openapi({ example: 'RESPONSABILE' }),
})

export const CreateUserSchema = z.object({
  firstName: z.string().min(1).openapi({ example: 'Mario' }),
  lastName: z.string().min(1).openapi({ example: 'Rossi' }),
  email: z.string().email().openapi({ example: 'mario@example.com' }),
  roleName: z.string().openapi({ example: 'DIPENDENTE' }).optional(),
})