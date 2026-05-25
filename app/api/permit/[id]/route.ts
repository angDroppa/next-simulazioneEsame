import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreatePermitSchema, UpdatePermitSchema } from '@/lib/schemas/permit.schema'
import { requireAuth } from '@/lib/auth-helper'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await requireAuth(req)
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const permit = await prisma.permit.findUnique({
        where: { id: Number(id) },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    })
    if (!permit) return NextResponse.json({ error: 'Permit non trovato' }, { status: 404 })

    if (user.roleName === 'DIPENDENTE' && permit.userId !== user.id) {
        return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    return NextResponse.json(permit)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await requireAuth(req)
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    if (user.roleName !== 'DIPENDENTE') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

    const permit = await prisma.permit.findUnique({ where: { id: Number(id) } })
    if (!permit) return NextResponse.json({ error: 'Permit non trovato' }, { status: 404 })
    if (permit.userId !== user.id) return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    if (permit.state !== null) return NextResponse.json({ error: 'Permit già valutato, non modificabile' }, { status: 403 })

    const body = await req.json()
    const parsed = CreatePermitSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })

    const updated = await prisma.permit.update({ where: { id: Number(id) }, data: parsed.data })
    return NextResponse.json(updated)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await requireAuth(req)
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    if (user.roleName !== 'RESPONSABILE') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

    const body = await req.json()
    const parsed = UpdatePermitSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })

    const permit = await prisma.permit.update({
        where: { id: Number(id) },
        data: { state: parsed.data.state, evaluationDate: new Date(), reviewerId: user.id },
    })

    return NextResponse.json(permit)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await requireAuth(req)
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    if (user.roleName !== 'RESPONSABILE') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

    const permit = await prisma.permit.findUnique({ where: { id: Number(id) } })
    if (!permit) return NextResponse.json({ error: 'Permit non trovato' }, { status: 404 })
    if (permit.state !== true) return NextResponse.json({ error: 'Puoi eliminare solo permit approvati' }, { status: 403 })

    await prisma.permit.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: 'Permit eliminato' })
}