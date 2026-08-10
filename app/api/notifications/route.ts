import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: ดึงรายการแจ้งเตือนของนักศึกษาคนหนึ่ง (เรียงล่าสุดก่อน) พร้อมจำนวนที่ยังไม่อ่าน
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentCode = searchParams.get('student_code')

    if (!studentCode) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ student_code' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('student_code', studentCode)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error

    const notifications = data || []
    const unreadCount = notifications.filter((n: any) => !n.is_read).length

    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (error: any) {
    console.error('GET /api/notifications error:', error)
    // 🟢 ถ้ายังไม่มีตาราง notifications ให้ตอบว่าไม่มีแจ้งเตือน แทนที่จะพังทั้งแอป
    return NextResponse.json({ success: true, notifications: [], unreadCount: 0 })
  }
}

// PATCH: ทำเครื่องหมายว่าอ่านแล้ว — ระบุ id รายการเดียว หรือ markAll + student_code เพื่ออ่านหมดทีเดียว
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, markAllForStudentCode } = body

    if (id) {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      if (error) throw error
    } else if (markAllForStudentCode) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('student_code', markAllForStudentCode)
        .eq('is_read', false)
      if (error) throw error
    } else {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ id หรือ markAllForStudentCode' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PATCH /api/notifications error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตแจ้งเตือน' },
      { status: 500 }
    )
  }
}
