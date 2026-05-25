import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreatePermitSchema } from '@/lib/schemas/permit.schema'
import { requireAuth } from '@/lib/auth-helper'

export async function POST(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  if (user.roleName !== 'DIPENDENTE') return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const body = await req.json()
  const parsed = CreatePermitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })

  const permit = await prisma.permit.create({
    data: { ...parsed.data, userId: user.id },
  })

  return NextResponse.json(permit, { status: 201 })
}

// export async function GET(req: Request) {
//   const user = await requireAuth(req)
//   if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

//   if (user.roleName === 'RESPONSABILE') {
//     const permits = await prisma.permit.findMany()
//     return NextResponse.json(permits)
//   }

//   const permits = await prisma.permit.findMany({ where: { userId: user.id } })
//   return NextResponse.json(permits)
// }

export async function GET(req: Request) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  if (user.roleName === 'RESPONSABILE') {
    const permits = await prisma.permit.findMany({
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

    return NextResponse.json(permits)
  }

  const permits = await prisma.permit.findMany({
    where: { userId: user.id },
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

  return NextResponse.json(permits)
}