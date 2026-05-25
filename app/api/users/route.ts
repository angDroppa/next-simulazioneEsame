import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { CreateUserSchema } from '@/lib/schemas/user.schema'
import crypto from 'crypto'

export async function GET() {
  const users = await prisma.user.findMany()
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const body = await req.json()

  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
  }

  const { roleName, ...rest } = parsed.data

  const { password: _, ...user } = await prisma.user.create({
    data: {
      ...rest,
      password: crypto.randomBytes(16).toString('hex'),
      role: { connect: { role: roleName ?? 'DIPENDENTE' } },
    },
  })

  return NextResponse.json(user, { status: 201 })
}