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

    // 1. ดึงข้อมูลผู้ใช้ก่อน (ไม่ join เพราะฐานข้อมูลยังไม่มี Foreign Key ระหว่าง users.group_id กับ groups.id)
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
        .select('name, class_name, project, status, comment')
        .eq('id', student.group_id)
        .single()

      groupInfo = groupData
    }

    // ตรวจสอบสถานะกลุ่ม
    let currentStatus = 'no_group'
    let displayStatus = 'ยังไม่มีกลุ่ม'
    let groupStatus = ''
    let groupComment = ''

    if (student.group_id && groupInfo) {
      groupStatus = groupInfo.status || 'pending'
      groupComment = groupInfo.comment || ''

      currentStatus = groupStatus
      if (currentStatus === 'approved' || currentStatus === 'approvals') {
        currentStatus = 'approved'
        displayStatus = '✅ อนุมัติแล้ว'
      } else if (currentStatus === 'rejected') {
        displayStatus = '❌ ไม่ผ่าน/รอแก้ไข'
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
        progress: 0,
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