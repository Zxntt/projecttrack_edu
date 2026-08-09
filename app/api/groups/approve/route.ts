import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // อัปเดตสถานะในตาราง groups (อนุมัติแล้ว / ไม่อนุมัติ) ด้วย Supabase
    const { error } = await supabase
      .from('groups')
      .update({
        status: status,
        reject_reason: rejectReason || null,
      })
      .eq('id', groupId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะโครงงานเรียบร้อยแล้ว (${status})`,
    })
  } catch (error: any) {
    console.error('Approve Error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติโครงงาน: ' + error.message },
      { status: 500 }
    )
  }
}