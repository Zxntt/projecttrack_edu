import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const student_code =
    searchParams.get('student_code')

  const [rows]: any = await db.query(
    `SELECT 
      u.name,
      u.student_code,
      g.name AS group_name,
      g.project,
      g.progress,
      g.status
    FROM users u
    JOIN groups g ON u.group_id = g.id
    WHERE u.student_code = ?`,
    [student_code]
  )

  return NextResponse.json(rows[0])
}