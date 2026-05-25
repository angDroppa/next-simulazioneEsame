import { NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.refreshToken) {
    return NextResponse.json({ error: 'Refresh token mancante' }, { status: 400 })
  }

  // 1. Verifica la firma e la scadenza JWT
  let payload
  try {
    payload = await verifyRefreshToken(body.refreshToken)
  } catch {
    return NextResponse.json({ error: 'Refresh token non valido' }, { status: 401 })
  }

  // 2. Verifica che il token esista nel DB e non sia scaduto
  //    Include l'utente così non serve una seconda query
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: body.refreshToken },
    include: {
      user: {
        include: { role: true },
      },
    },
  })

  if (!storedToken || storedToken.expiresAt < new Date()) {
    // Pulizia: rimuovi il token scaduto se esiste ancora
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { token: body.refreshToken } })
    }
    return NextResponse.json({ error: 'Refresh token scaduto o non valido' }, { status: 401 })
  }

  // 3. Genera nuovi token (refresh token rotation)
  const accessToken = await signAccessToken({ id: payload.id, email: payload.email })
  const newRefreshToken = await signRefreshToken({ id: payload.id, email: payload.email })

  // 4. Sostituisci il vecchio refresh token nel DB (atomico con transaction)
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { token: body.refreshToken } }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  const { user } = storedToken

  return NextResponse.json({
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleName: user.role.role,
    },
  })
}