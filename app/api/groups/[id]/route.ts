import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT: แก้ไขข้อมูลกลุ่ม
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const groupId = resolvedParams.id
    const body = await request.json()
    const { className, groupName, projectName, members } = body

    // 1. แก้ไขข้อมูลในตาราง groups
    await db.query(
      'UPDATE groups SET class_name = ?, name = ?, project = ? WHERE id = ?',
      [className, groupName, projectName, groupId]
    )

    // 2. ลบสมาชิกเก่า แล้วใส่สมาชิกใหม่
    await db.query('DELETE FROM group_members WHERE group_id = ?', [groupId])

    if (members && members.length > 0) {
      for (let member of members) {
        await db.query(
          'INSERT INTO group_members (group_id, student_id, fullname) VALUES (?, ?, ?)',
          [groupId, member.studentId, member.fullname]
        )
      }
    }

    return NextResponse.json({ message: 'Updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: ลบกลุ่ม
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const groupId = resolvedParams.id

    await db.query('DELETE FROM groups WHERE id = ?', [groupId])

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}