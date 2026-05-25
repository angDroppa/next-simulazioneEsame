import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const PermitSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    startDate: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' }),
    endDate: z.string().datetime().openapi({ example: '2024-01-07T00:00:00Z' }),
    categoryId: z.string().openapi({ example: 'Ferie' }),
    motivation: z.string().openapi({ example: 'Vacanza estiva' }),
    state: z.boolean().nullable().openapi({ example: null }),
    evaluationDate: z.string().datetime().nullable().openapi({ example: null }),
    userId: z.number().openapi({ example: 1 }),
    reviewerId: z.number().nullable().openapi({ example: null }),

    // ✅ AGGIUNGI QUESTO
    user: z
        .object({
            id: z.number(),
            firstName: z.string(),
            lastName: z.string(),
        })
        .optional(),
})

export const CreatePermitSchema = z.object({
    startDate: z.string().min(1, { message: 'Data inizio obbligatoria' }),
    endDate: z.string().min(1, { message: 'Data fine obbligatoria' }),
    categoryId: z.string().min(1, { message: 'Categoria obbligatoria' }),
    motivation: z.string().min(1, { message: 'Motivazione obbligatoria' }),
})

export const UpdatePermitSchema = z.object({
    state: z.boolean(),
})

export type Permit = z.infer<typeof PermitSchema>
export type CreatePermit = z.infer<typeof CreatePermitSchema>
export type UpdatePermit = z.infer<typeof UpdatePermitSchema>