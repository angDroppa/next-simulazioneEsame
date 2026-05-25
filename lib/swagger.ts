import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { UserSchema, CreateUserSchema } from './schemas/user.schema'
import { RegisterSchema, LoginSchema, LoginResponseSchema } from './schemas/auth.schema'
import { PermitSchema, CreatePermitSchema } from './schemas/permit.schema'
import { z } from 'zod'
import { PermitCategorySchema } from './schemas/permit-category.schema'

const registry = new OpenAPIRegistry()

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
})

registry.register('User', UserSchema)
registry.register('Register', RegisterSchema)
registry.register('Login', LoginSchema)
registry.register('Permit', PermitSchema)

// Register
registry.registerPath({
    method: 'post',
    path: '/api/auth/register',
    summary: 'Registra un nuovo utente',
    request: {
        body: {
            content: { 'application/json': { schema: RegisterSchema } },
        },
    },
    responses: {
        201: { description: 'Utente registrato' },
        400: { description: 'Dati non validi' },
        409: { description: 'Email già esistente' },
    },
})

// Login
registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    summary: 'Login e ottieni JWT',
    request: {
        body: {
            content: { 'application/json': { schema: LoginSchema } },
        },
    },
    responses: {
        200: {
            description: 'Login riuscito',
            content: { 'application/json': { schema: LoginResponseSchema } },
        },
        401: { description: 'Credenziali non valide' },
    },
})

// Refresh
registry.registerPath({
    method: 'post',
    path: '/api/auth/refresh',
    summary: 'Ottieni nuovo access token (con refresh token rotation)',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Nuovi token (rotation)',
            content: {
                'application/json': {
                    schema: LoginResponseSchema, // ← stessa shape di /login: accessToken + refreshToken + user
                },
            },
        },
        401: { description: 'Refresh token non valido o scaduto' },
    },
})

// Logout
registry.registerPath({
    method: 'post',
    path: '/api/auth/logout',
    summary: 'Logout e invalida refresh token',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Logout effettuato' },
        400: { description: 'Refresh token mancante' },
    },
})

// Users
registry.registerPath({
    method: 'get',
    path: '/api/users',
    summary: 'Lista tutti gli utenti',
    security: [{ [bearerAuth.name]: [] }],
    responses: {
        200: {
            description: 'Lista utenti',
            content: { 'application/json': { schema: z.array(UserSchema) } },
        },
        401: { description: 'Non autorizzato' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/users',
    summary: 'Crea un utente',
    security: [{ [bearerAuth.name]: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: CreateUserSchema } },
        },
    },
    responses: {
        201: {
            description: 'Utente creato',
            content: { 'application/json': { schema: UserSchema } },
        },
        400: { description: 'Dati non validi' },
        401: { description: 'Non autorizzato' },
    },
})

// Permits
registry.registerPath({
    method: 'get',
    path: '/api/permit',
    summary: 'Lista permit (tutti per RESPONSABILE, solo i propri per DIPENDENTE)',
    security: [{ [bearerAuth.name]: [] }],
    responses: {
        200: {
            description: 'Lista permit',
            content: { 'application/json': { schema: z.array(PermitSchema) } },
        },
        401: { description: 'Non autorizzato' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/permit',
    summary: 'Crea un permit (solo DIPENDENTE)',
    security: [{ [bearerAuth.name]: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: CreatePermitSchema } },
        },
    },
    responses: {
        201: {
            description: 'Permit creato',
            content: { 'application/json': { schema: PermitSchema } },
        },
        400: { description: 'Dati non validi' },
        401: { description: 'Non autorizzato' },
        403: { description: 'Accesso negato' },
    },
})

registry.registerPath({
    method: 'patch',
    path: '/api/permit/{id}',
    summary: 'Aggiorna stato permit (solo RESPONSABILE)',
    security: [{ [bearerAuth.name]: [] }],
    request: {
        params: z.object({ id: z.string().openapi({ example: '1' }) }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({ state: z.boolean().openapi({ example: true }) }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Permit aggiornato',
            content: { 'application/json': { schema: PermitSchema } },
        },
        401: { description: 'Non autorizzato' },
        403: { description: 'Accesso negato' },
        404: { description: 'Permit non trovato' },
    },
})

registry.registerPath({
    method: 'delete',
    path: '/api/permit/{id}',
    summary: 'Elimina permit approvato (solo RESPONSABILE)',
    security: [{ [bearerAuth.name]: [] }],
    request: {
        params: z.object({ id: z.string().openapi({ example: '1' }) }),
    },
    responses: {
        200: { description: 'Permit eliminato' },
        401: { description: 'Non autorizzato' },
        403: { description: 'Accesso negato' },
        404: { description: 'Permit non trovato' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/permit/{id}',
    summary: 'Dettaglio permit (RESPONSABILE tutti, DIPENDENTE solo i propri)',
    security: [{ [bearerAuth.name]: [] }],
    request: {
        params: z.object({ id: z.string().openapi({ example: '1' }) }),
    },
    responses: {
        200: {
            description: 'Dettaglio permit',
            content: { 'application/json': { schema: PermitSchema } },
        },
        401: { description: 'Non autorizzato' },
        403: { description: 'Accesso negato' },
        404: { description: 'Permit non trovato' },
    },
})

registry.registerPath({
    method: 'put',
    path: '/api/permit/{id}',
    summary: 'Modifica permit (solo DIPENDENTE proprietario, solo se stato null)',
    security: [{ [bearerAuth.name]: [] }],
    request: {
        params: z.object({ id: z.string().openapi({ example: '1' }) }),
        body: {
            content: { 'application/json': { schema: CreatePermitSchema } },
        },
    },
    responses: {
        200: {
            description: 'Permit modificato',
            content: { 'application/json': { schema: PermitSchema } },
        },
        400: { description: 'Dati non validi' },
        401: { description: 'Non autorizzato' },
        403: { description: 'Accesso negato' },
        404: { description: 'Permit non trovato' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/permit-category',
    summary: 'Lista categorie permit',
    security: [{ [bearerAuth.name]: [] }],
    responses: {
        200: {
            description: 'Lista categorie',
            content: { 'application/json': { schema: z.array(PermitCategorySchema) } },
        },
        401: { description: 'Non autorizzato' },
    },
})

export function getApiDocs() {
    const generator = new OpenApiGeneratorV3(registry.definitions)
    return generator.generateDocument({
        openapi: '3.0.0',
        info: { title: 'My API', version: '1.0.0' },
        servers: [{ url: 'http://localhost:3000' }],
    })
}