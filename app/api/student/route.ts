import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentCode = searchParams.get('student_code')

    if (!studentCode || studentCode === 'undefined') {
      return NextResponse.json(
        { error: 'กรุณาระบุ student_code' },
        { status: 400 }
      )
    }

    // ดึงข้อมูลจากตาราง users พร้อมเชื่อม (LEFT JOIN) กับตาราง groups (เผื่อถูกเพิ่มเข้ากลุ่มแล้ว)
    const [rows]: any = await db.query(
      `SELECT 
        u.id, 
        u.student_code, 
        u.name, 
        u.email, 
        u.role, 
        u.project_name AS user_project,
        u.group_id,
        g.name AS group_name,
        g.project AS group_project
       FROM users u
       LEFT JOIN \`groups\` g ON u.group_id = g.id
       WHERE u.student_code = ?`,
      [studentCode]
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลนักศึกษานี้ในระบบ' },
        { status: 404 }
      )
    }

    const student = rows[0]

    // ส่งข้อมูลกลับไปหาฝั่ง Frontend
    return NextResponse.json({
      name: student.name, // 👈 ส่งชื่อจริงที่สมัครสมาชิกเข้ามา
      student_code: student.student_code,
      group_name: student.group_name || 'ยังไม่มีกลุ่ม (รอแอดมินเพิ่มเข้ากลุ่ม)',
      project: student.group_project || student.user_project || 'ยังไม่ได้ระบุโครงงาน',
      progress: 0,
      status: 'รอการส่งงาน',
    })
  } catch (error: any) {
    console.error('API Student Error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา' },
      { status: 500 }
    )
  }
}