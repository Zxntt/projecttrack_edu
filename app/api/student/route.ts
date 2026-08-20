import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentCode = searchParams.get('student_code')

    if (!studentCode || studentCode === 'undefined' || studentCode === 'null') {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ student_code' },
        { status: 400 }
      )
    }

    // 1. ดึงข้อมูลผู้ใช้ก่อน
    const { data: student, error: userError } = await supabase
      .from('users')
      .select('id, student_code, name, email, role, group_id')
      .eq('student_code', studentCode)
      .single()

    if (userError || !student) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลนักศึกษานี้ในระบบ' },
        { status: 404 }
      )
    }

    // 2. ถ้ามี group_id ให้ไปดึงข้อมูลกลุ่มแยกอีกรอบ
    let groupInfo: any = null
    if (student.group_id) {
      const { data: groupData } = await supabase
        .from('groups')
        .select('name, class_name, project, status, comment, progress')
        .eq('id', student.group_id)
        .single()

      groupInfo = groupData
    }

    // 🟢 3. ดึงข้อมูลรายงานความคืบหน้า (progress_reports) ของกลุ่มนี้ เพื่อหาเปอร์เซ็นต์และสถานะล่าสุด
    // 🟢 ใช้ groups.progress เป็นค่าเริ่มต้น/สำรอง เพราะ update-progress จะอัปเดตค่านี้เสมอ
    //    แม้ progress_reports จะ insert ไม่สำเร็จ (เช่น ตารางไม่มี/RLS บล็อก) เปอร์เซ็นต์ก็จะยังไม่ตกเป็น 0
    let latestProgress = Number(groupInfo?.progress) || 0
    let reportStatus = ''
    let reportComment = ''

    if (student.group_id) {
      const { data: reports, error: reportError } = await supabase
        .from('progress_reports')
        .select('progress, status, teacher_comment, created_at')
        .eq('group_id', student.group_id)
        .order('created_at', { ascending: false }) // 🟢 แก้ไข: เรียงจากเวลาล่าสุด (created_at) เพื่อให้ได้งานที่เพิ่งส่งล่าสุดจริงๆ

      if (!reportError && reports && reports.length > 0) {
        // เอาเปอร์เซ็นต์จากรายงานล่าสุด (ถ้ามี) แต่ถ้าค่าเป็น 0/ว่าง ให้ใช้ groups.progress แทน
        latestProgress = Number(reports[0].progress) || latestProgress

        reportStatus = reports[0].status || ''
        reportComment = reports[0].teacher_comment || ''
      }
    }

    // ตรวจสอบสถานะกลุ่ม
    let currentStatus = 'no_group'
    let displayStatus = 'ยังไม่มีกลุ่ม'
    let groupStatus = ''
    let groupComment = ''

    if (student.group_id && groupInfo) {
      groupStatus = groupInfo.status || 'pending'
      groupComment = reportComment || groupInfo.comment || ''

      currentStatus = reportStatus || groupStatus
      
      // แปลงสถานะให้แสดงผลเป็นภาษาไทยที่เข้าใจง่าย
      if (currentStatus === 'approved' || currentStatus === 'approvals' || currentStatus === 'checked') {
        currentStatus = 'checked'
        displayStatus = '✅ อาจารย์ตรวจแล้ว'
      } else if (currentStatus === 'rejected') {
        displayStatus = '❌ ไม่ผ่าน/รอแก้ไข'
      } else if (currentStatus === 'waiting_review') {
        displayStatus = '🔍 รออาจารย์ตรวจ'
      } else {
        displayStatus = '⏳ รออาจารย์อนุมัติ'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: student.id,
        name: student.name,
        studentCode: student.student_code,
        groupId: student.group_id,
        groupName: groupInfo?.name || 'ยังไม่มีกลุ่ม',
        className: groupInfo?.class_name || 'ปวส.2 สายตรง',
        project: groupInfo?.project || 'ยังไม่ได้ระบุโครงงาน',
        status: currentStatus,
        displayStatus: displayStatus,
        comment: groupComment,
        progress: latestProgress, // 🟢 ส่งค่าเปอร์เซ็นต์จากรายงานล่าสุด
      },
    })
  } catch (error: any) {
    console.error('API Student Error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา: ' + error.message },
      { status: 500 }
    )
  }
}