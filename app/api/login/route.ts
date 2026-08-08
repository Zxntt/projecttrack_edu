import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // รับได้ทั้ง email, student_code หรือ identifier ทั่วไปจาก Frontend
    const { email, student_code, identifier, password } = body

    const userIdentifier = (identifier || email || student_code || '').trim()

    if (!userIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสนักศึกษา/อีเมล และรหัสผ่าน' },
        { status: 400 }
      )
    }

    // ค้นหาผู้ใช้ตาม email หรือ student_code
    const [rows]: any = await db.query(
      'SELECT id, name, student_code, email, password, role, group_id FROM users WHERE email = ? OR student_code = ?',
      [userIdentifier, userIdentifier]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้นี้ในระบบ' },
        { status: 401 }
      )
    }

    const user = rows[0]

    // ตรวจสอบรหัสผ่าน
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // ส่งเฉพาะข้อมูลผู้ใช้งานกลับไป (ไม่ส่ง password กลับ)
    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        name: user.name,
        student_code: user.student_code,
        email: user.email,
        role: user.role,
        group_id: user.group_id,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: ' + error.message },
      { status: 500 }
    )
  }
}