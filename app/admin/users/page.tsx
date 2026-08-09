import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: ดึงรายชื่อผู้ใช้ทั้งหมด
export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [], { status: 200 })
  } catch (error: any) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: เพิ่มผู้ใช้ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_code, name, email, password, role, project_name } = body

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          student_code,
          name,
          email,
          password, // คำแนะนำ: ในอนาคตควรทำ Hash password ก่อนบันทึก
          role: role || 'student',
          project_name: project_name || null,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: แก้ไขข้อมูลผู้ใช้
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, student_code, name, email, role, project_name } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ไม่พบ ID ผู้ใช้ที่ต้องการแก้ไข' }, { status: 400 })
    }

    const updateData: any = {
      student_code,
      name,
      email,
      role,
      project_name,
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error: any) {
    console.error('PUT /api/users error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: ลบผู้ใช้
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ไม่พบ ID ที่ต้องการลบ' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'ลบสำเร็จ' }, { status: 200 })
  } catch (error: any) {
    console.error('DELETE /api/users error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}