import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  const connection = await db.getConnection()
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

    // 1. ค้นหากลุ่มของนักเรียน
    const [userRows]: any = await connection.query(
      'SELECT group_id FROM users WHERE student_code = ?',
      [studentCode]
    )

    let groupId = userRows[0]?.group_id

    if (!groupId && groupName) {
      const [groupRows]: any = await connection.query(
        'SELECT id FROM `groups` WHERE name = ? OR group_name = ?',
        [groupName, groupName]
      )
      groupId = groupRows[0]?.id
    }

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลกลุ่มโครงงานของนักศึกษา' },
        { status: 404 }
      )
    }

    // 2. จัดการอัปโหลดไฟล์ (ถ้ามี)
    let filePath = null
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (e) {
        // Folder already exists
      }

      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      filePath = `/uploads/${fileName}`

      await writeFile(path.join(uploadDir, fileName), buffer)
    }

    await connection.beginTransaction()

    // 🟢 3. อัปเดตตาราง groups: 
    // เปลี่ยน status กลับมาเป็น 'pending' เพื่อให้ขึ้นในแท็บรอตรวจของอาจารย์
    // บันทึก progress, description และ file_url
    await connection.query(
      `UPDATE \`groups\` 
       SET progress = ?, 
           status = 'pending', 
           comment = ?, 
           file_url = COALESCE(?, file_url) 
       WHERE id = ?`,
      [
        Number(progress) || 0,
        description ? `[รายงานความคืบหน้า ${progress}%]: ${description}` : null,
        filePath,
        groupId,
      ]
    )

    // 4. บันทึกลงตารางประวัติรายงานความคืบหน้า (ถ้ามี)
    try {
      await connection.query(
        `INSERT INTO progress_reports 
         (group_id, student_code, progress, description, file_path, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [groupId, studentCode, Number(progress) || 0, description || '', filePath]
      )
    } catch (e) {
      // ข้ามกรณีไม่มีตาราง progress_reports
    }

    await connection.commit()

    return NextResponse.json({
      success: true,
      message: 'ส่งรายงานความคืบหน้าเรียบร้อยแล้ว รออาจารย์อนุมัติ',
    })
  } catch (error: any) {
    await connection.rollback()
    console.error('Error in /api/update-progress:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  } finally {
    connection.release()
  }
}