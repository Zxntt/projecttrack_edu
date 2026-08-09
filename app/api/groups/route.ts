import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: ดึงข้อมูลกลุ่มทั้งหมด + รายชื่อสมาชิกของแต่ละกลุ่ม
export async function GET() {
  try {
    // 1. ดึงข้อมูลจากตาราง groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .order('id', { ascending: false })

    if (groupsError) throw groupsError

    // 2. ดึงสมาชิกของแต่ละกลุ่ม
    const groupsWithMembers = await Promise.all(
      (groups || []).map(async (group: any) => {
        let members = []
        const { data: memberRows, error: memberError } = await supabase
          .from('group_members')
          .select('student_id, fullname')
          .eq('group_id', group.id)

        if (!memberError && memberRows) {
          members = memberRows.map((m: any) => ({
            studentId: m.student_id,
            fullname: m.fullname,
          }))
        }

        return {
          ...group,
          members: members,
          className: group.class_name || '',
          groupName: group.name || group.group_name || '',
          projectName: group.project || group.project_name || '',
        }
      })
    )

    return NextResponse.json(groupsWithMembers)
  } catch (error: any) {
    console.error('GET /api/groups error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups: ' + error.message },
      { status: 500 }
    )
  }
}

// POST: บันทึกกลุ่มใหม่ + บันทึกสมาชิก + อัปเดต users
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { className, groupName, projectName, members, createdBy } = body

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!className || !groupName || !projectName) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลกลุ่มให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาเพิ่มสมาชิกอย่างน้อย 1 คน' },
        { status: 400 }
      )
    }

    if (!createdBy) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้สร้างกลุ่ม (กรุณาเข้าสู่ระบบใหม่)' },
        { status: 400 }
      )
    }

    // 1. บันทึกลงตาราง groups (พร้อมเลือกค่า id กลับมาด้วย)
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert([
        {
          class_name: className,
          name: groupName,
          project: projectName,
          progress: 0,
          status: 'pending', // 🟢 ตั้งค่าเริ่มต้นเป็น 'pending'
          created_by: createdBy,
        },
      ])
      .select()

    if (groupError) throw groupError

    const newGroupId = groupData[0].id

    // 2. บันทึกรายชื่อสมาชิกลง group_members และอัปเดต group_id ใน users
    const memberErrors: string[] = []
    for (const member of members) {
      const studentId = member.studentId || member.student_code
      const fullname = member.fullname || member.name

      // 2.1 เพิ่มเข้าตาราง group_members
      const { error: memberInsertError } = await supabase.from('group_members').insert([
        {
          group_id: newGroupId,
          student_id: studentId,
          fullname: fullname,
        },
      ])
      if (memberInsertError) {
        console.error('group_members insert error:', memberInsertError)
        memberErrors.push(`${fullname || studentId}: ${memberInsertError.message}`)
      }

      // 2.2 อัปเดต group_id ในตาราง users
      if (studentId) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ group_id: newGroupId })
          .eq('student_code', studentId)
        if (userUpdateError) {
          console.error('users update error:', userUpdateError)
          memberErrors.push(`${fullname || studentId}: ${userUpdateError.message}`)
        }
      }
    }

    if (memberErrors.length > 0) {
      console.warn('POST /api/groups: บันทึกสมาชิกบางคนไม่สำเร็จ:', memberErrors)
    }

    // 3. อัปเดต group_id ให้กับผู้สร้างกลุ่ม (createdBy) ในตาราง users
    // รองรับทั้งกรณี createdBy เป็น id (number) หรือ student_code (string)
    if (typeof createdBy === 'number' || !isNaN(Number(createdBy))) {
      await supabase
        .from('users')
        .update({ group_id: newGroupId })
        .eq('id', createdBy)
    } else {
      await supabase
        .from('users')
        .update({ group_id: newGroupId })
        .eq('student_code', createdBy)
    }

    // 4. ส่งผลลัพธ์กลับไปให้หน้าเว็บ
    return NextResponse.json(
      {
        success: true,
        message: 'สร้างกลุ่มสำเร็จ',
        id: newGroupId,
        groupId: newGroupId,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST /api/groups error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์: ' + (error.message || 'Failed to create group') },
      { status: 500 }
    )
  }
}