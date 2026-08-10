'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type UserRow = {
  id: number
  student_code: string | null
  name: string
  email: string | null
  role: string
  group_id: number | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  // 🔐 ตรวจสิทธิ์: หน้านี้สำหรับอาจารย์เท่านั้น
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.replace('/login')
      return
    }
    try {
      const user = JSON.parse(userStr)
      const role = String(user.role || '').trim().toLowerCase()
      if (role !== 'teacher') {
        // ล็อกอินแล้วแต่ไม่ใช่อาจารย์ -> เด้งไปหน้าของตัวเอง ไม่ใช่บังคับ login ใหม่
        router.replace('/student')
        return
      }
      setChecking(false)
      fetchUsers()
    } catch {
      router.replace('/login')
    }
  }, [router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fetch users error:', error)
      alert('ไม่สามารถโหลดรายชื่อผู้ใช้ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบผู้ใช้นี้หรือไม่?')) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id))
      } else {
        alert('ลบไม่สำเร็จ')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้')
    }
  }

  // 🟢 เปลี่ยนบทบาทผู้ใช้ (student <-> teacher)
  const handleRoleChange = async (targetUser: UserRow, newRole: string) => {
    if (targetUser.role === newRole) return

    const prevUsers = users
    // อัปเดตหน้าจอทันที (optimistic) เพื่อความลื่นไหล
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
    )
    setSavingId(targetUser.id)

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetUser.id,
          student_code: targetUser.student_code,
          name: targetUser.name,
          email: targetUser.email,
          role: newRole,
          group_id: targetUser.group_id,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error('update failed')
      }
    } catch (error) {
      console.error('Update role error:', error)
      alert('เปลี่ยนบทบาทไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      // ย้อนกลับข้อมูลเดิมถ้าบันทึกไม่สำเร็จ
      setUsers(prevUsers)
    } finally {
      setSavingId(null)
    }
  }

  if (checking) return null

  return (
    <main className="min-h-screen bg-[#05070d] p-6 text-slate-200">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              👥 จัดการผู้ใช้งานระบบ
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              สำหรับอาจารย์เท่านั้น · จัดการบัญชีนักเรียนและอาจารย์
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20"
          >
            ← กลับหน้าหลัก
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
          {loading ? (
            <p className="p-6 text-center font-mono text-sm text-slate-500">กำลังโหลด...</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-800/80">
              <thead className="bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">รหัสนักศึกษา</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">ชื่อ</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">อีเมล</th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">บทบาท</th>
                  <th className="px-4 py-3 text-center font-mono text-xs uppercase tracking-wider text-slate-500">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center font-mono text-xs text-slate-500">
                      ไม่พบข้อมูลผู้ใช้
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-sm text-cyan-300">{u.student_code || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-200">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{u.email || '-'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role === 'teacher' ? 'teacher' : 'student'}
                          disabled={savingId === u.id}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-mono outline-none transition-colors ${
                            u.role === 'teacher'
                              ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                              : 'border-slate-700 bg-slate-800 text-cyan-300'
                          } ${savingId === u.id ? 'opacity-50' : 'cursor-pointer hover:brightness-110'}`}
                        >
                          <option value="student" className="bg-slate-900 text-slate-200">
                            STUDENT
                          </option>
                          <option value="teacher" className="bg-slate-900 text-slate-200">
                            TEACHER
                          </option>
                        </select>
                        {savingId === u.id && (
                          <span className="ml-2 font-mono text-[10px] text-slate-500">กำลังบันทึก...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}