import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ดึงผู้ใช้ทั้งหมด
export async function GET() {
  try {
    const { data: rows, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    return NextResponse.json(rows || [])
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// เพิ่มผู้ใช้
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      student_code,
      name,
      email,
      password,
      role,
      group_id,
    } = body

    const { error } = await supabase
      .from('users')
      .insert([
        {
          student_code: student_code || null,
          name,
          email: email || null,
          password,
          role,
          group_id: group_id || null,
        },
      ])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}

// แก้ไขผู้ใช้
export async function PUT(req: Request) {
  try {
    const body = await req.json()

    const {
      id,
      student_code,
      name,
      email,
      role,
      group_id,
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('users')
      .update({
        student_code: student_code || null,
        name,
        email: email || null,
        role,
        group_id: group_id || null,
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}

// ลบผู้ใช้
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}