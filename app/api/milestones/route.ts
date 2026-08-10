import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: ดึงรายการไมล์สโตนทั้งหมด เรียงตามเปอร์เซ็นต์
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('percent', { ascending: true })

    if (error) {
      console.error('GET /api/milestones error:', error)
      // 🟢 ถ้ายังไม่มีตาราง milestones ในฐานข้อมูล ให้ตอบว่าไม่มีข้อมูล แทนที่จะพังทั้งหน้า
      return NextResponse.json({ success: true, milestones: [] })
    }

    return NextResponse.json({ success: true, milestones: data || [] })
  } catch (error: any) {
    console.error('GET /api/milestones error:', error)
    return NextResponse.json({ success: true, milestones: [] })
  }
}

// PATCH: อาจารย์แก้ไขชื่อ/กำหนดส่งของไมล์สโตนแต่ละอัน
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, due_date } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ id ของไมล์สโตน' },
        { status: 400 }
      )
    }

    const updatePayload: Record<string, any> = {}
    if (name !== undefined) updatePayload.name = name?.trim() || null
    // ส่งค่าว่างมา = ล้างกำหนดส่ง
    if (due_date !== undefined) updatePayload.due_date = due_date || null

    const { error } = await supabase.from('milestones').update(updatePayload).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true, message: 'บันทึกไมล์สโตนเรียบร้อยแล้ว' })
  } catch (error: any) {
    console.error('PATCH /api/milestones error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกไมล์สโตน' },
      { status: 500 }
    )
  }
}
