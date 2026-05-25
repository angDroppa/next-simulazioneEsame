import { verifyAccessToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function requireAuth(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) return null

  try {
    const decoded = await verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, roleName: true },
    })

    return user
  } catch {
    return null
  }
}