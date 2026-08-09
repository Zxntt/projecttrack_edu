import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, student_code, identifier, password } = body
    const userIdentifier = (identifier || email || student_code || '').trim()

    if (!userIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // 1. ค้นหาผู้ใช้โดยใช้ .or() แบบปลอดภัย
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, student_code, email, password, role, group_id')
      .or(`email.eq.${userIdentifier},student_code.eq.${userIdentifier}`)

    if (error) {
      console.error('Supabase Query Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบชื่อผู้ใช้งานนี้' },
        { status: 401 }
      )
    }

    const user = users[0]

    // 2. ตรวจสอบรหัสผ่าน
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // 3. ส่งข้อมูลกลับ
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
    console.error('Critical Login Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'ระบบขัดข้อง' },
      { status: 500 }
    )
  }
}