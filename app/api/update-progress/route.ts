import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.json()
  const { groupName, progress } = body

  await db.query(
    'UPDATE groups SET progress = ?, status = ? WHERE name = ?',
    [progress, 'รอตรวจ', groupName]
  )

  return NextResponse.json({ success: true })
}