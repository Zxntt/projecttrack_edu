import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT: แก้ไขข้อมูลกลุ่ม (เฉพาะเจ้าของกลุ่มหรืออาจารย์เท่านั้น)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await db.getConnection() // ใช้ connection สำหรับ Transaction
  try {
    const { id: groupId } = await params
    const body = await request.json()
    const { className, groupName, projectName, members, requesterStudentId, requesterRole } = body

    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Missing group ID' }, { status: 400 })
    }

    // 🔍 1. ดึงข้อมูลกลุ่มเดิมมาตรวจสอบสิทธิ์ก่อน
    const [rows]: any = await connection.query(
      'SELECT created_by, status FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบกลุ่มนี้ในระบบ' }, { status: 404 })
    }

    const currentGroup = rows[0]

    // 🟢 แปลงค่าทั้งสองฝั่งเป็น String เพื่อป้องกันปัญหา Type mismatch (Number vs String)
    const dbOwnerId = String(currentGroup.created_by || '').trim()
    const currentRequesterId = String(requesterStudentId || '').trim()

    // 🔒 2. ตรวจสอบสิทธิ์การแก้ไข
    // อนุญาตถ้า: เป็น teacher OR ID ตรงกัน OR กลุ่มไม่มีผู้สร้างเดิม
    const isOwner = dbOwnerId !== '' && dbOwnerId === currentRequesterId
    const isTeacher = requesterRole === 'teacher'

    if (!isTeacher && !isOwner) {
      return NextResponse.json(
        { success: false, error: '⛔ คุณไม่มีสิทธิ์แก้ไขกลุ่มนี้ (เฉพาะผู้สร้างกลุ่มเท่านั้น)' },
        { status: 403 }
      )
    }

    // 🔒 3. ป้องกันการแก้ไขถ้ากลุ่มถูกอนุมัติไปแล้ว (เว้นแต่อาจารย์เป็นคนแก้)
    if (!isTeacher && currentGroup.status === 'approved') {
      return NextResponse.json(
        { success: false, error: '⛔ ไม่สามารถแก้ไขกลุ่มที่ได้รับการอนุมัติแล้วได้' },
        { status: 400 }
      )
    }

    // เริ่ม Transaction
    await connection.beginTransaction()

    // 1. แก้ไขข้อมูลในตาราง groups
    await connection.query(
      'UPDATE `groups` SET class_name = ?, name = ?, project = ? WHERE id = ?',
      [className || null, groupName || null, projectName || null, groupId]
    )

    // 2. เคลียร์ group_id ในตาราง users ของสมาชิกเดิมในกลุ่มนี้ก่อน
    await connection.query('UPDATE users SET group_id = NULL WHERE group_id = ?', [groupId])

    // 3. ลบสมาชิกเดิมออกจากตาราง group_members
    await connection.query('DELETE FROM group_members WHERE group_id = ?', [groupId])

    // 4. บันทึกสมาชิกใหม่ลง group_members และผูก group_id ใหม่ในตาราง users
    if (members && Array.isArray(members) && members.length > 0) {
      for (const member of members) {
        const studentId = member.studentId || member.student_code
        const fullname = member.fullname || member.name

        if (studentId) {
          // บันทึกใน group_members
          await connection.query(
            'INSERT INTO group_members (group_id, student_id, fullname) VALUES (?, ?, ?)',
            [groupId, studentId, fullname || '']
          )

          // อัปเดต group_id ในตาราง users
          await connection.query(
            'UPDATE users SET group_id = ? WHERE student_code = ?',
            [groupId, studentId]
          )
        }
      }
    }

    // ยืนยันการเปลี่ยนแปลงทั้งหมด
    await connection.commit()

    return NextResponse.json({ success: true, message: 'แก้ไขข้อมูลกลุ่มสำเร็จ' })
  } catch (error: any) {
    await connection.rollback()
    console.error('PUT /api/groups/[id] error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  } finally {
    connection.release() // คืน connection กลับสู่ pool
  }
}

// DELETE: ลบกลุ่ม (เฉพาะเจ้าของกลุ่มหรืออาจารย์เท่านั้น)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await db.getConnection()
  try {
    const { id: groupId } = await params

    const { searchParams } = new URL(request.url)
    const requesterStudentId = searchParams.get('studentId')
    const requesterRole = searchParams.get('role')

    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Missing group ID' }, { status: 400 })
    }

    // 🔍 1. ดึงข้อมูลกลุ่มเดิมมาตรวจสอบสิทธิ์ก่อน
    const [rows]: any = await connection.query(
      'SELECT created_by, status FROM `groups` WHERE id = ?',
      [groupId]
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบกลุ่มที่ต้องการลบ' }, { status: 404 })
    }

    const currentGroup = rows[0]

    // 🟢 แปลงค่าเป็น String ก่อนเปรียบเทียบ
    const dbOwnerId = String(currentGroup.created_by || '').trim()
    const currentRequesterId = String(requesterStudentId || '').trim()

    const isOwner = dbOwnerId !== '' && dbOwnerId === currentRequesterId
    const isTeacher = requesterRole === 'teacher'

    // 🔒 2. ตรวจสอบสิทธิ์การลบ
    if (!isTeacher && !isOwner) {
      return NextResponse.json(
        { success: false, error: '⛔ คุณไม่มีสิทธิ์ลบกลุ่มนี้ (เฉพาะผู้สร้างกลุ่มเท่านั้น)' },
        { status: 403 }
      )
    }

    // 🔒 3. ป้องกันการลบถ้ากลุ่มอนุมัติไปแล้ว (เว้นแต่างอาจารย์สั่งลบ)
    if (!isTeacher && currentGroup.status === 'approved') {
      return NextResponse.json(
        { success: false, error: '⛔ ไม่สามารถลบกลุ่มที่ได้รับการอนุมัติแล้วได้' },
        { status: 400 }
      )
    }

    // เริ่ม Transaction
    await connection.beginTransaction()

    // 1. เคลียร์ group_id ในตาราง users
    await connection.query('UPDATE users SET group_id = NULL WHERE group_id = ?', [groupId])

    // 2. ลบสมาชิกออกจากตาราง group_members
    await connection.query('DELETE FROM group_members WHERE group_id = ?', [groupId])

    // 3. ลบกลุ่มออกจากตาราง groups
    await connection.query('DELETE FROM `groups` WHERE id = ?', [groupId])

    // ยืนยันการลบทั้งหมด
    await connection.commit()

    return NextResponse.json({ success: true, message: 'ลบกลุ่มสำเร็จ' })
  } catch (error: any) {
    await connection.rollback()
    console.error('DELETE /api/groups/[id] error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  } finally {
    connection.release()
  }
}