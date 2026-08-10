import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId, studentCode, email, oldPassword, newPassword } = await req.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่' }, { status: 400 })
    }

    let user = null

    // 1. ค้นหาจาก email ก่อน (มีความแม่นยำสูงที่สุด)
    if (email) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle()
      if (error) console.error('Lookup by email error:', error)
      user = data
    }

    // 2. ถ้ายังไม่เจอ ลองค้นหาจาก student_code
    if (!user && studentCode) {
      const { data, error } = await supabase.from('users').select('*').eq('student_code', studentCode).maybeSingle()
      if (error) console.error('Lookup by student_code error:', error)
      user = data
    }

    // 3. ถ้ายังไม่เจออีก ค่อยลองค้นหาจาก id ใน localStorage
    if (!user && userId) {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
      if (error) console.error('Lookup by id error:', error)
      user = data
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'ไม่พบข้อมูลผู้ใช้งานในฐานข้อมูล กรุณาล็อกอินใหม่อีกครั้งเพื่อรีเฟรชข้อมูล' 
      }, { status: 404 })
    }

    // ตรวจสอบรหัสผ่านเดิม
    if (user.password !== oldPassword) {
      return NextResponse.json({ success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 })
    }

    // อัปเดตรหัสผ่านใหม่โดยอ้างอิงจาก id จริงที่พบในฐานข้อมูล
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' }, { status: 500 })
  }
}