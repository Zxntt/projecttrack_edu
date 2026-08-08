import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { groupId, status, rejectReason } = body

    if (!groupId || !status) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุ groupId และ status' },
        { status: 400 }
      )
    }

    // อัปเดตสถานะในตาราง groups (อนุมัติแล้ว / ไม่อนุมัติ)
    await db.query(
      `UPDATE \`groups\` SET status = ?, reject_reason = ? WHERE id = ?`,
      [status, rejectReason || null, groupId]
    )

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะโครงงานเรียบร้อยแล้ว (${status})`,
    })
  } catch (error: any) {
    console.error('Approve Error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติโครงงาน' },
      { status: 500 }
    )
  }
}