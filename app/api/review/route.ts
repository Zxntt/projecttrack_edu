import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { groupName, status } = body

    await db.query(
      'UPDATE groups SET status = ? WHERE name = ?',
      [status, groupName]
    )

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะเรียบร้อยแล้ว',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}