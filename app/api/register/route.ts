import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_code, name, email, password, role = 'student' } = body

    // 1. ตรวจสอบเบื้องต้นตามบทบาท (Role)
    if (!name || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อและรหัสผ่านให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // กรณีเป็นนักเรียน ต้องมีรหัสนักศึกษา
    if (role === 'student' && !student_code) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสนักศึกษา' },
        { status: 400 }
      )
    }

    const studentCode = student_code ? student_code.trim() : null
    // ถ้าไม่มีอีเมลส่งมา ให้สร้างอีเมลอัตโนมัติจากรหัสนักศึกษา
    const userEmail = email ? email.trim() : `${studentCode}@cmtc.ac.th`

    // 2. เช็กว่ารหัสนักศึกษาซ้ำหรือไม่ (เฉพาะกรณีมี student_code)
    if (studentCode) {
      const [existingStudent]: any = await db.query(
        'SELECT id FROM users WHERE student_code = ?',
        [studentCode]
      )
      if (existingStudent.length > 0) {
        return NextResponse.json(
          { success: false, error: 'รหัสนักศึกษานี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        )
      }
    }

    // 3. เช็กว่าอีเมลซ้ำหรือไม่
    const [existingEmail]: any = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [userEmail]
    )
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้มีผู้ใช้งานแล้วในระบบ' },
        { status: 400 }
      )
    }

    // 4. บันทึกข้อมูลใหม่ลงตาราง users (กำหนดให้ group_id เป็น NULL ในตอนแรก)
    await db.query(
      'INSERT INTO users (student_code, name, email, password, role, group_id) VALUES (?, ?, ?, ?, ?, NULL)',
      [studentCode, name.trim(), userEmail, password, role]
    )

    return NextResponse.json(
      { success: true, message: 'สมัครสมาชิกสำเร็จ' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Register Error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + error.message },
      { status: 500 }
    )
  }
}