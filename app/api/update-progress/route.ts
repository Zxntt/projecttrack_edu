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

    // 🟢 DEBUG: เช็คว่าเซิร์ฟเวอร์ได้รับไฟล์มาจริงไหม
    const fileDebug = file
      ? { received: true, name: file.name, size: file.size, type: file.type }
      : { received: false }

    if (!studentCode) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรหัสนักศึกษา', debug: { fileDebug } },
        { status: 400 }
      )
    }

    // 1. ค้นหากลุ่มของนักเรียนจากตาราง users
    const { data: userData } = await supabase
      .from('users')
      .select('group_id')
      .eq('student_code', studentCode)
      .single()

    let groupId = userData?.group_id

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
        { success: false, error: 'ไม่พบข้อมูลกลุ่มโครงงานของนักศึกษา', debug: { fileDebug } },
        { status: 404 }
      )
    }

    // 2. จัดการอัปโหลดไฟล์ไปที่ Supabase Storage
    let filePath = null
    let uploadFailed = false
    let uploadErrorMessage = ''

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()

      // ดึงนามสกุลไฟล์เดิม (เช่น .png, .pdf) แบบปลอดภัย
      const originalExt = file.name.includes('.')
        ? file.name.split('.').pop()!.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        : ''

      // สร้างชื่อไฟล์ใหม่เป็น timestamp + random string ล้วน (ไม่มีอักขระไทย/พิเศษ)
      // เพื่อให้ผ่านกฎ key ของ Supabase Storage (รองรับเฉพาะ a-z A-Z 0-9 - _ . * ' ( ) /)
      const randomId = Math.random().toString(36).slice(2, 10)
      const fileName = `${Date.now()}_${randomId}${originalExt ? '.' + originalExt : ''}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        uploadFailed = true
        uploadErrorMessage = uploadError.message
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName)

        filePath = publicUrlData.publicUrl
      }
    }

    // 🟢 ถ้าอัปโหลดไม่สำเร็จ ให้หยุดและแจ้ง error กลับไปทันที พร้อมรายละเอียด debug
    if (uploadFailed) {
      return NextResponse.json(
        {
          success: false,
          error: `⛔ อัปโหลดไฟล์ไม่สำเร็จ: ${uploadErrorMessage}`,
          debug: { fileDebug, uploadErrorMessage },
        },
        { status: 500 }
      )
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
        status: 'pending',
        comment: description ? `[รายงานความคืบหน้า ${progress}%]: ${description}` : null,
        file_url: finalFileUrl,
      })
      .eq('id', groupId)

    if (updateError) throw updateError

    // 5. บันทึกลงตารางประวัติรายงานความคืบหน้า
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

    // 🟢 ส่ง debug กลับไปด้วยเสมอ ให้เห็นชัดว่าเกิดอะไรขึ้นกับไฟล์
    return NextResponse.json({
      success: true,
      message: 'ส่งรายงานความคืบหน้าเรียบร้อยแล้ว รออาจารย์อนุมัติ',
      fileUrl: finalFileUrl,
      debug: { fileDebug, groupId, savedFileUrl: finalFileUrl },
    })
  } catch (error: any) {
    console.error('Error in /api/update-progress:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}