import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: ดึงข้อมูลกลุ่มทั้งหมด + รายชื่อสมาชิกของแต่ละกลุ่ม
export async function GET() {
  try {
    // 1. ดึงข้อมูลจากตาราง groups เดิม
    const [groups]: any = await db.query('SELECT * FROM groups ORDER BY id DESC')

    // 2. วนลูปดึงสมาชิกจากตาราง group_members มาต่อใส่ในแต่ละกลุ่ม
    for (let group of groups) {
      const [members]: any = await db.query(
        'SELECT student_id AS studentId, fullname FROM group_members WHERE group_id = ?',
        [group.id]
      )
      group.members = members
      
      // แปลงชื่อคอลัมน์ให้ตรงกับหน้า UI
      group.className = group.class_name
      group.groupName = group.name
      group.projectName = group.project
    }

    return NextResponse.json(groups)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST: บันทึกกลุ่มใหม่ + บันทึกสมาชิก
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { className, groupName, projectName, members } = body

    // 1. บันทึกลงตาราง groups เดิม (ตั้งค่า progress = 0, status = 'รอตรวจ' ให้อัตโนมัติ)
    const [result]: any = await db.query(
      'INSERT INTO groups (class_name, name, project, progress, status) VALUES (?, ?, ?, 0, "รอตรวจ")',
      [className, groupName, projectName]
    )

    const newGroupId = result.insertId

    // 2. บันทึกรายชื่อสมาชิกลงตาราง group_members
    if (members && members.length > 0) {
      for (let member of members) {
        await db.query(
          'INSERT INTO group_members (group_id, student_id, fullname) VALUES (?, ?, ?)',
          [newGroupId, member.studentId, member.fullname]
        )
      }
    }

    return NextResponse.json({ message: 'Success', id: newGroupId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}