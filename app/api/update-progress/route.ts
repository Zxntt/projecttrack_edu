import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const studentCode = formData.get('student_code') as string
    const groupName = formData.get('groupName') as string
    const progress = formData.get('progress') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File | null

    if (!studentCode) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรหัสนักศึกษา' },
        { status: 400 }
      )
    }

    // 1. ค้นหากลุ่มของนักเรียนจากตาราง users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('group_id')
      .eq('student_code', studentCode)
      .single()

    let groupId = userData?.group_id

    // ถ้าไม่พบ group_id จาก users แต่มี groupName ส่งมา ให้ลองหาจากตาราง groups
    if (!groupId && groupName) {
      const { data: groupData } = await supabase
        .from('groups')
        .select('id')
        .or(`name.eq.${groupName},group_name.eq.${groupName}`)
        .limit(1)

      if (groupData && groupData.length > 0) {
        groupId = groupData[0].id
      }
    }

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลกลุ่มโครงงานของนักศึกษา' },
        { status: 404 }
      )
    }

    // 2. จัดการอัปโหลดไฟล์ไปที่ Supabase Storage (แนะนำให้สร้าง Bucket ชื่อ 'uploads' ไว้ล่วงหน้าใน Supabase)
    let filePath = null
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      
      // อัปโหลดไฟล์ขึ้น Supabase Storage (Bucket ชื่อ 'uploads')
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // ถ้าไม่ใช้ Supabase Storage แต่จะเก็บแบบ Local เหมือนเดิม คุณสามารถคงโค้ด writeFile แบบเดิมไว้ได้ครับ
      } else {
        // ดึง Public URL ของไฟล์ที่อัปโหลด
        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName)
        
        filePath = publicUrlData.publicUrl
      }
    }

    // 3. ดึงข้อมูล file_url เดิมของกลุ่มมาเผื่อกรณีไม่ได้อัปโหลดไฟล์ใหม่
    const { data: currentGroup } = await supabase
      .from('groups')
      .select('file_url')
      .eq('id', groupId)
      .single()

    const finalFileUrl = filePath || currentGroup?.file_url || null

    // 4. อัปเดตตาราง groups
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        progress: Number(progress) || 0,
        status: 'pending', // เปลี่ยนสถานะกลับเป็น pending เพื่อให้อาจารย์ตรวจใหม่
        comment: description ? `[รายงานความคืบหน้า ${progress}%]: ${description}` : null,
        file_url: finalFileUrl,
      })
      .eq('id', groupId)

    if (updateError) throw updateError

    // 5. บันทึกลงตารางประวัติรายงานความคืบหน้า (progress_reports) ถ้ามีตารางนี้ในฐานข้อมูล
    try {
      await supabase.from('progress_reports').insert([
        {
          group_id: groupId,
          student_code: studentCode,
          progress: Number(progress) || 0,
          description: description || '',
          file_path: finalFileUrl,
        },
      ])
    } catch (e) {
      // ข้ามกรณีไม่มีตาราง progress_reports ใน Supabase
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งรายงานความคืบหน้าเรียบร้อยแล้ว รออาจารย์อนุมัติ',
    })
  } catch (error: any) {
    console.error('Error in /api/update-progress:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}