import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_code, name, email, password, role = 'student' } = body

    // 1. ตรวจสอบเบื้องต้นว่ากรอกครบไหม
    if (!student_code || !name || !email || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' },
        { status: 400 }
      )
    }

    // 2. เช็กว่ารหัสผู้ใช้ หรือ อีเมลนี้ ซ้ำในตาราง users หรือยัง
    const [existingUsers]: any = await db.query(
      'SELECT id FROM users WHERE student_code = ? OR email = ?',
      [student_code, email]
    )

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'รหัสผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      )
    }

    // 3. บันทึกข้อมูลใหม่ลงตาราง users
    await db.query(
      'INSERT INTO users (student_code, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [student_code, name, email, password, role]
    )

    return NextResponse.json(
      { message: 'สมัครสมาชิกสำเร็จ' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Register Error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    )
  }
}