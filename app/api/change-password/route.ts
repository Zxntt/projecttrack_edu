import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { userId, oldPassword, newPassword } = await req.json()

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    // 1. ดึงข้อมูลผู้ใช้จากตาราง users เพื่อเช็ครหัสผ่านเดิม
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 })
    }

    // 2. ตรวจสอบว่ารหัสผ่านเดิมตรงกันไหม (ระบบโปรเจกต์นี้ใช้ข้อความธรรมดาหรือเทียบสตริง)
    if (user.password !== oldPassword) {
      return NextResponse.json({ success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 })
    }

    // 3. อัปเดตรหัสผ่านใหม่ลงในตาราง users
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' }, { status: 500 })
  }
}