import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 🟢 ปิด Cache ป้องกัน Next.js จำผลลัพธ์เก่า
export const dynamic = 'force-dynamic'

// GET: ดึงรายการกลุ่มตามสถานะ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get('status')
    
    // ถ้านักเรียน/อาจารย์ไม่ได้ส่ง status มา ให้ default เป็น 'pending'
    const statusFilter = (rawStatus || 'pending').trim().toLowerCase()

    // 🟢 สร้าง Query หลักสำหรับ Supabase ตาราง groups
    let query = supabase.from('groups').select('*').order('id', { ascending: false })

    if (statusFilter === 'pending') {
      // กวาดกลุ่มที่เป็น 'pending', 'รอตรวจ', 'รออนุมัติ', NULL หรือค่าว่าง ทั้งหมด
      query = query.or("status.ilike.pending,status.eq.รอตรวจ,status.eq.รออนุมัติ,status.is.null,status.eq.''")
    } else if (statusFilter !== 'all') {
      query = query.ilike('status', statusFilter)
    }

    const { data: groups, error: groupsError } = await query
    if (groupsError) throw groupsError

    // ดึงรายชื่อสมาชิกของแต่ละกลุ่ม
    const groupsWithMembers = await Promise.all(
      (groups || []).map(async (group: any) => {
        let members: { studentId: string; fullname: string }[] = []
        try {
          // 1. ลองดึงจากตาราง group_members ก่อน
          const { data: memberRows, error: memberError } = await supabase
            .from('group_members')
            .select('student_id, fullname')
            .eq('group_id', group.id)

          if (!memberError && memberRows && memberRows.length > 0) {
            members = memberRows.map((m: any) => ({
              studentId: m.student_id,
              fullname: m.fullname,
            }))
          } else {
            // 2. ถ้าไม่พบ ให้ลองดึงจากตาราง users ที่มี group_id ตรงกัน
            const { data: userMembers, error: userError } = await supabase
              .from('users')
              .select('student_code, name')
              .eq('group_id', group.id)

            if (!userError && userMembers) {
              members = userMembers.map((u: any) => ({
                studentId: u.student_code,
                fullname: u.name,
              }))
            }
          }
        } catch (e) {
          console.error('Fetch members error:', e)
        }

        // 🟢 ดึงประวัติการส่งงานของกลุ่มนี้ทั้งหมด เพื่อให้อาจารย์คอมเมนต์แยกได้ทีละรอบ
        let reports: any[] = []
        try {
          const { data: reportRows, error: reportError } = await supabase
            .from('progress_reports')
            .select('*')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })

          if (!reportError && reportRows) {
            reports = reportRows
          }
        } catch (e) {
          console.error('Fetch progress_reports error:', e)
        }

        return {
          id: group.id,
          className: group.class_name || group.className || 'ปวส.2 สายตรง',
          groupName: group.name || group.groupName || `กลุ่มที่ ${group.id}`,
          projectName: group.project || group.project_name_th || group.projectName || 'ยังไม่ระบุหัวข้อ',
          progress: Number(group.progress) || 0, // ส่งเปอร์เซ็นต์ความคืบหน้าให้อาจารย์เห็น
          status: (group.status || 'pending').trim().toLowerCase(),
          comment: group.comment || '',
          fileUrl: group.file_url || null, // ส่งลิงก์ไฟล์งานให้อาจารย์
          createdAt: group.created_at,
          members: members,
          reports: reports, // 🟢 ประวัติการส่งงานทีละรอบ พร้อมคอมเมนต์ต่อรอบ
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithMembers,
    })
  } catch (error: any) {
    console.error('GET /api/approvals error:', error)
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงข้อมูลได้: ' + error.message },
      { status: 500 }
    )
  }
}

// PATCH: อัปเดตสถานะการอนุมัติ
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { groupId, status, comment } = body

    if (!groupId || !status) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ groupId และ status' },
        { status: 400 }
      )
    }

    const targetStatus = status.trim().toLowerCase()
    const targetComment = comment?.trim() || null

    // อัปเดตข้อมูลด้วย Supabase
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        status: targetStatus,
        comment: targetComment,
      })
      .eq('id', groupId)

    if (updateError) throw updateError

    // 🟢 แจ้งเตือนสมาชิกในกลุ่มทุกคนว่าสถานะโครงงานเปลี่ยน
    try {
      const { data: members } = await supabase
        .from('group_members')
        .select('student_id')
        .eq('group_id', groupId)

      // 🟢 ปรับเงื่อนไขแยกตามสถานะจริง เพื่อให้แจ้งเตือนถูกต้อง (รองรับ 'checked')
      let statusLabel = ''
      if (targetStatus === 'approved') {
        statusLabel = '✅ โครงงานของคุณได้รับการอนุมัติแล้ว'
      } else if (targetStatus === 'checked') {
        statusLabel = '✅ โครงงานของคุณได้รับการตรวจเรียบร้อยแล้ว'
      } else {
        statusLabel = '❌ โครงงานของคุณถูกส่งกลับให้แก้ไข'
      }

      const message = targetComment ? `${statusLabel}: ${targetComment}` : statusLabel

      if (members && members.length > 0) {
        await supabase.from('notifications').insert(
          members.map((m: any) => ({
            student_code: m.student_id,
            group_id: groupId,
            message,
          }))
        )
      }
    } catch (notifyError) {
      // ไม่ให้การแจ้งเตือนพังกระทบการอนุมัติหลัก
      console.error('Notification insert error:', notifyError)
    }

    return NextResponse.json({
      success: true,
      message: targetStatus === 'approved' ? 'อนุมัติเรียบร้อยแล้ว' : 'ส่งข้อเสนอแนะเรียบร้อยแล้ว',
    })
  } catch (error: any) {
    console.error('PATCH /api/approvals error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + error.message },
      { status: 500 }
    )
  }
}