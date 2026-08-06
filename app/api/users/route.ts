import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ดึงผู้ใช้ทั้งหมด
export async function GET() {
  const [rows] = await db.query(
    'SELECT * FROM users ORDER BY id DESC'
  )

  return NextResponse.json(rows)
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

    await db.query(
      `INSERT INTO users
      (student_code, name, email, password, role, group_id)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student_code,
        name,
        email,
        password,
        role,
        group_id || null,
      ]
    )

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

    await db.query(
      `UPDATE users
       SET student_code = ?, name = ?, email = ?, role = ?, group_id = ?
       WHERE id = ?`,
      [
        student_code,
        name,
        email,
        role,
        group_id || null,
        id,
      ]
    )

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

    await db.query('DELETE FROM users WHERE id = ?', [
      id,
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}