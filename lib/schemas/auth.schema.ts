import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { UserSchema } from './user.schema'

extendZodWithOpenApi(z)

export const RegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Email non valida' }).openapi({ example: 'mario@example.com' }),
  password: z.string().min(1, { message: 'Inserisci la password' }).openapi({ example: 'password123' }),
})

export const LoginResponseSchema = z.object({
  accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
  refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
  user: UserSchema,
})

// solo per validazione client-side, confirmPassword non viene inviato all'API
export const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono.',
  path: ['confirmPassword'],
})

export type RegisterForm = z.infer<typeof RegisterFormSchema>
export type Register = z.infer<typeof RegisterSchema>
export type Login = z.infer<typeof LoginSchema>