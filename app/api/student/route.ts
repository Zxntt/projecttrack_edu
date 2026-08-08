import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    // ดึงเฉพาะคอลัมน์หลักที่มีอยู่ชัวร์ๆ
    const [rows]: any = await db.query(
      `SELECT 
        u.id AS user_id, 
        u.student_code, 
        u.name, 
        u.email, 
        u.role, 
        u.group_id,
        g.name AS group_name,
        g.class_name,
        g.project
       FROM users u
       LEFT JOIN \`groups\` g ON u.group_id = g.id
       WHERE u.student_code = ?`,
      [studentCode]
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลนักศึกษานี้ในระบบ' },
        { status: 404 }
      )
    }

    const student = rows[0]

    // ตรวจสอบสถานะกลุ่ม
    let currentStatus = 'no_group'
    let displayStatus = 'ยังไม่มีกลุ่ม'

    if (student.group_id) {
      // ดึงสถานะและ comment แบบแยกปลอดภัย เผื่อตารางไม่มีคอลัมน์
      try {
        const [groupCheck]: any = await db.query(
          'SELECT status, comment FROM `groups` WHERE id = ?',
          [student.group_id]
        )
        if (groupCheck && groupCheck.length > 0) {
          student.group_status = groupCheck[0].status
          student.group_comment = groupCheck[0].comment
        }
      } catch (e) {
        // หากไม่มีคอลัมน์ status/comment ในกลุ่ม จะไม่ให้ระบบค้าง
      }

      currentStatus = student.group_status || 'pending'
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
        userId: student.user_id,
        name: student.name,
        studentCode: student.student_code,
        groupId: student.group_id,
        groupName: student.group_name || 'ยังไม่มีกลุ่ม',
        className: student.class_name || 'ปวส.2 สายตรง',
        project: student.project || 'ยังไม่ได้ระบุโครงงาน',
        status: currentStatus,
        displayStatus: displayStatus,
        comment: student.group_comment || '',
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