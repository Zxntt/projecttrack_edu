import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: เช็คว่ากลุ่มนี้ส่งงาน (รายงานความคืบหน้า) อะไรไปแล้วบ้าง
// ใช้ query param อย่างใดอย่างหนึ่ง: group_id หรือ groupName
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupIdParam = searchParams.get('group_id')
    const groupName = searchParams.get('groupName')

    let groupId: number | string | null = groupIdParam

    // ถ้าไม่มี group_id ตรงๆ ให้ลองหาเจ้าของกลุ่มจากชื่อกลุ่ม
    if (!groupId && groupName) {
      const { data: groupData } = await supabase
        .from('groups')
        .select('id')
        .or(`name.eq.${groupName},group_name.eq.${groupName}`)
        .limit(1)

      if (groupData && groupData.length > 0) {
        groupId = groupData[0].id
      }
    }

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ group_id หรือ groupName' },
        { status: 400 }
      )
    }

    // ดึงประวัติการส่งงานทั้งหมดของกลุ่มนี้ เรียงจากล่าสุดไปเก่าสุด
    const { data: reports, error: reportsError } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    // 🟢 ถ้ายังไม่มีตาราง progress_reports ในฐานข้อมูล ให้ถือว่ายังไม่เคยส่งงาน (ไม่ error ทั้งระบบ)
    if (reportsError) {
      console.error('GET /api/progress-reports error:', reportsError)
      return NextResponse.json({
        success: true,
        groupId,
        reports: [],
        submittedLevels: [],
      })
    }

    const reportList = reports || []

    // 🟢 สรุปว่าเปอร์เซ็นต์งาน (25/50/75/100) ไหนบ้างที่เคยส่งไปแล้ว
    const submittedLevels = Array.from(
      new Set(reportList.map((r: any) => Number(r.progress)))
    ).sort((a, b) => a - b)

    return NextResponse.json({
      success: true,
      groupId,
      reports: reportList,
      submittedLevels,
    })
  } catch (error: any) {
    console.error('GET /api/progress-reports error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการดึงประวัติการส่งงาน' },
      { status: 500 }
    )
  }
}

// PATCH: อาจารย์ให้คอมเมนต์/ข้อเสนอแนะสำหรับการส่งงานรอบใดรอบหนึ่งโดยเฉพาะ
// (แยกจาก groups.comment เพื่อไม่ให้คอมเมนต์รอบเก่าถูกเขียนทับ)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { reportId, teacherComment } = body

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ reportId' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('progress_reports')
      .update({ teacher_comment: teacherComment?.trim() || null })
      .eq('id', reportId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'บันทึกความเห็นเรียบร้อยแล้ว',
    })
  } catch (error: any) {
    console.error('PATCH /api/progress-reports error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกความเห็น' },
      { status: 500 }
    )
  }
}
