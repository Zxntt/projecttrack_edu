import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    const [rows]: any = await db.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
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
        role: user.role,
        group_id: user.group_id,
      },
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}