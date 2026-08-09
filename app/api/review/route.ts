import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { groupName, status } = body

    if (!groupName || !status) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุ groupName และ status' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('groups')
      .update({ status })
      .eq('name', groupName)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะเรียบร้อยแล้ว',
    })
  } catch (error: any) {
    console.error(error)

    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด: ' + (error.message || '') },
      { status: 500 }
    )
  }
}