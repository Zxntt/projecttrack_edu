import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 🟢 ปิด Cache ป้องกัน Next.js จำผลลัพธ์เก่า
export const dynamic = 'force-dynamic'

// GET: ดึงรายการกลุ่มตามสถานะ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get('status')
    
    // ถ้านักเรียน/อาจารย์ไม่ได้ส่ง status มา ให้ default เป็น 'pending'
    const statusFilter = (rawStatus || 'pending').trim().toLowerCase()

    let query = 'SELECT * FROM `groups` ORDER BY id DESC'
    let queryParams: any[] = []

    if (statusFilter === 'pending') {
      // 🟢 กวาดกลุ่มที่เป็น 'pending', 'รอตรวจ', 'รออนุมัติ', NULL หรือค่าว่าง ทั้งหมด
      query = `SELECT * FROM \`groups\` 
               WHERE LOWER(TRIM(status)) = 'pending' 
                  OR status = 'รอตรวจ' 
                  OR status = 'รออนุมัติ' 
                  OR status IS NULL 
                  OR TRIM(status) = '' 
               ORDER BY id DESC`
    } else if (statusFilter !== 'all') {
      query = 'SELECT * FROM `groups` WHERE LOWER(TRIM(status)) = ? ORDER BY id DESC'
      queryParams = [statusFilter]
    }

    const [groups]: any = await db.query(query, queryParams)

    // ดึงรายชื่อสมาชิกของแต่ละกลุ่ม
    const groupsWithMembers = await Promise.all(
      groups.map(async (group: any) => {
        let members = []
        try {
          const [memberRows]: any = await db.query(
            'SELECT student_id as studentId, fullname FROM group_members WHERE group_id = ?',
            [group.id]
          )
          members = memberRows || []

          if (members.length === 0) {
            const [userMembers]: any = await db.query(
              'SELECT student_code as studentId, name as fullname FROM users WHERE group_id = ?',
              [group.id]
            )
            members = userMembers || []
          }
        } catch (e) {
          console.error('Fetch members error:', e)
        }

        return {
          id: group.id,
          className: group.class_name || group.className || 'ปวส.2 สายตรง',
          groupName: group.name || group.groupName || `กลุ่มที่ ${group.id}`,
          projectName: group.project || group.project_name_th || group.projectName || 'ยังไม่ระบุหัวข้อ',
          progress: Number(group.progress) || 0, // 🟢 ส่งเปอร์เซ็นต์ความคืบหน้าให้อาจารย์เห็น
          status: (group.status || 'pending').trim().toLowerCase(),
          comment: group.comment || '',
          fileUrl: group.file_url || null, // 👈 ส่งลิงก์ไฟล์งานให้อาจารย์
          createdAt: group.created_at,
          members: members,
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithMembers,
    })
  } catch (error: any) {
    console.error('GET /api/approvals error:', error)
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงข้อมูลได้: ' + error.message },
      { status: 500 }
    )
  }
}

// PATCH: อัปเดตสถานะการอนุมัติ
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { groupId, status, comment } = body

    if (!groupId || !status) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ groupId และ status' },
        { status: 400 }
      )
    }

    const targetStatus = status.trim().toLowerCase()

    try {
      await db.query(
        'UPDATE `groups` SET status = ?, comment = ? WHERE id = ?',
        [targetStatus, comment?.trim() || null, groupId]
      )
    } catch (err: any) {
      if (err.errno === 1054 || err.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(
          'UPDATE `groups` SET status = ? WHERE id = ?',
          [targetStatus, groupId]
        )
      } else {
        throw err
      }
    }

    return NextResponse.json({
      success: true,
      message: targetStatus === 'approved' ? 'อนุมัติเรียบร้อยแล้ว' : 'ส่งข้อเสนอแนะเรียบร้อยแล้ว',
    })
  } catch (error: any) {
    console.error('PATCH /api/approvals error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + error.message },
      { status: 500 }
    )
  }
}