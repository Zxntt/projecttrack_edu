import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { userId, oldPassword, newPassword } = await req.json()

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    // ลองค้นหาผู้ใช้จาก id (รองรับทั้งแบบตัวเลขและตัวอักษร)
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError || !user) {
      return NextResponse.json({ success: false, error: `ไม่พบข้อมูลผู้ใช้งาน (ID: ${userId}) ในฐานข้อมูล` }, { status: 404 })
    }

    // ตรวจสอบรหัสผ่านเดิม
    if (user.password !== oldPassword) {
      return NextResponse.json({ success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 })
    }

    // อัปเดตรหัสผ่านใหม่
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