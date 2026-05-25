// app/api/permit-category/route.ts
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const categories = await prisma.permitCategory.findMany()
  return NextResponse.json(categories)
}