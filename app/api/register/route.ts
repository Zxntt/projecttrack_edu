import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
      const { data: existingStudent, error: studentError } = await supabase
        .from('users')
        .select('id')
        .eq('student_code', studentCode)

      if (studentError) throw studentError

      if (existingStudent && existingStudent.length > 0) {
        return NextResponse.json(
          { success: false, error: 'รหัสนักศึกษานี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        )
      }
    }

    // 3. เช็กว่าอีเมลซ้ำหรือไม่
    const { data: existingEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)

    if (emailError) throw emailError

    if (existingEmail && existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้มีผู้ใช้งานแล้วในระบบ' },
        { status: 400 }
      )
    }

    // 4. บันทึกข้อมูลใหม่ลงตาราง users (กำหนดให้ group_id เป็น NULL ในตอนแรก)
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          student_code: studentCode,
          name: name.trim(),
          email: userEmail,
          password: password,
          role: role,
          group_id: null,
        },
      ])

    if (insertError) throw insertError

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