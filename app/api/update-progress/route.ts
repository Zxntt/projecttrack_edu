import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const studentCode = formData.get('student_code') as string
    const groupName = formData.get('groupName') as string
    const progress = formData.get('progress') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File | null

    if (!studentCode || !progress) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    let fileUrl = null

    // ถ้ามีการแนบไฟล์มา ให้บันทึกไฟล์ลงโฟลเดอร์ public/uploads
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // สร้างโฟลเดอร์ public/uploads ถ้ายังไม่มี
      const uploadDir = path.join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })

      // ตั้งชื่อไฟล์ใหม่ด้วย Timestamp เพื่อป้องกันชื่อไฟล์ซ้ำกัน
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      const fullPath = path.join(uploadDir, fileName)

      await writeFile(fullPath, buffer)
      fileUrl = `/uploads/${fileName}`
    }

    // อัปเดตข้อมูลลงฐานข้อมูล MySQL
    await db.query(
      `UPDATE \`groups\` g
       JOIN users u ON u.group_id = g.id
       SET g.progress = ?, g.comment = ?, g.file_url = COALESCE(?, g.file_url)
       WHERE u.student_code = ?`,
      [Number(progress), description, fileUrl, studentCode]
    )

    return NextResponse.json({
      success: true,
      message: 'ส่งความคืบหน้าและแนบไฟล์เรียบร้อยแล้ว!',
      fileUrl: fileUrl,
    })
  } catch (error: any) {
    console.error('Update progress error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message },
      { status: 500 }
    )
  }
}