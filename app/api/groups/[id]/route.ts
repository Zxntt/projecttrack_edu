import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PUT: แก้ไขข้อมูลกลุ่ม
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const body = await request.json()
    const { className, groupName, projectName, members, requesterStudentId, requesterRole } = body

    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Missing group ID' }, { status: 400 })
    }

    // 1. ตรวจสอบสิทธิ์ (Fetch กลุ่มเดิม)
    const { data: currentGroup, error: fetchError } = await supabase
      .from('groups')
      .select('created_by, status')
      .eq('id', groupId)
      .single()

    if (fetchError || !currentGroup) {
      return NextResponse.json({ success: false, error: 'ไม่พบกลุ่มนี้ในระบบ' }, { status: 404 })
    }

    // ตรวจสอบสิทธิ์
    const dbOwnerId = String(currentGroup.created_by || '').trim()
    const currentRequesterId = String(requesterStudentId || '').trim()
    const isOwner = dbOwnerId !== '' && dbOwnerId === currentRequesterId
    const isTeacher = requesterRole === 'teacher'

    if (!isTeacher && !isOwner) {
      return NextResponse.json({ success: false, error: '⛔ คุณไม่มีสิทธิ์แก้ไขกลุ่มนี้' }, { status: 403 })
    }

    if (!isTeacher && currentGroup.status === 'approved') {
      return NextResponse.json({ success: false, error: '⛔ ไม่สามารถแก้ไขกลุ่มที่อนุมัติแล้ว' }, { status: 400 })
    }

    // 2. อัปเดตข้อมูลกลุ่ม
    await supabase.from('groups').update({
      class_name: className || null,
      name: groupName || null,
      project: projectName || null
    }).eq('id', groupId)

    // 3. จัดการสมาชิกใหม่ (ลบของเก่า -> ใส่ของใหม่)
    await supabase.from('users').update({ group_id: null }).eq('group_id', groupId)
    await supabase.from('group_members').delete().eq('group_id', groupId)

    if (members && Array.isArray(members) && members.length > 0) {
      for (const member of members) {
        const studentId = member.studentId || member.student_code
        const fullname = member.fullname || member.name

        if (studentId) {
          await supabase.from('group_members').insert({ group_id: groupId, student_id: studentId, fullname })
          await supabase.from('users').update({ group_id: groupId }).eq('student_code', studentId)
        }
      }
    }

    return NextResponse.json({ success: true, message: 'แก้ไขข้อมูลกลุ่มสำเร็จ' })
  } catch (error: any) {
    console.error('PUT /api/groups/[id] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: ลบกลุ่ม
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const requesterStudentId = searchParams.get('studentId')
    const requesterRole = searchParams.get('role')

    const { data: currentGroup } = await supabase
      .from('groups')
      .select('created_by, status')
      .eq('id', groupId)
      .single()

    if (!currentGroup) return NextResponse.json({ success: false, error: 'ไม่พบกลุ่ม' }, { status: 404 })

    const isOwner = String(currentGroup.created_by || '').trim() === String(requesterStudentId || '').trim()
    const isTeacher = requesterRole === 'teacher'

    if (!isTeacher && !isOwner) return NextResponse.json({ success: false, error: '⛔ ไม่มีสิทธิ์' }, { status: 403 })
    if (!isTeacher && currentGroup.status === 'approved') return NextResponse.json({ success: false, error: '⛔ ไม่สามารถลบกลุ่มที่อนุมัติแล้ว' }, { status: 400 })

    // ลบสมาชิก และ ลบกลุ่ม
    await supabase.from('users').update({ group_id: null }).eq('group_id', groupId)
    await supabase.from('group_members').delete().eq('group_id', groupId)
    await supabase.from('groups').delete().eq('id', groupId)

    return NextResponse.json({ success: true, message: 'ลบกลุ่มสำเร็จ' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}