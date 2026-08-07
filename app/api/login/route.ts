import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // รับได้ทั้ง email หรือ student_code จากช่องล็อกอิน
    const { email, student_code, password } = body

    // ใช้ identifier ซึ่งเป็นได้ทั้ง email หรือ student_code ที่ส่งมาจากหน้าเว็บ
    const userIdentifier = email || student_code

    if (!userIdentifier || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // ค้นหาว่าตรงกับ email OR student_code ตัวใดตัวหนึ่ง
    const [rows]: any = await db.query(
      'SELECT * FROM users WHERE (email = ? OR student_code = ?) AND password = ?',
      [userIdentifier, userIdentifier, password]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'อีเมล / รหัสนักศึกษา หรือรหัสผ่านไม่ถูกต้อง',
        },
        { status: 401 }
      )
    }

    const user = rows[0]

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        student_code: user.student_code,
        email: user.email,
        role: user.role,
        group_id: user.group_id,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}