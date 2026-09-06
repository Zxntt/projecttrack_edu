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
      setUsers(prevUsers)
    } finally {
      setSavingId(null)
    }
  }

  if (checking) return null

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              👥 จัดการผู้ใช้งานระบบ
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              สำหรับอาจารย์เท่านั้น · จัดการบัญชีนักเรียนและอาจารย์
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            ← กลับหน้าหลัก
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-12 text-center text-sm text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">รหัสนักศึกษา</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">ชื่อ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">อีเมล</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">บทบาท</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-gray-400">
                      ไม่พบข้อมูลผู้ใช้
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-blue-600 font-medium">{u.student_code || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{u.email || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role === 'teacher' ? 'teacher' : 'student'}
                            disabled={savingId === u.id}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium outline-none transition ${
                              u.role === 'teacher'
                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                : 'border-blue-200 bg-blue-50 text-blue-700'
                            } ${savingId === u.id ? 'opacity-50' : 'cursor-pointer hover:bg-gray-100'}`}
                          >
                            <option value="student" className="bg-white text-gray-800">
                              STUDENT
                            </option>
                            <option value="teacher" className="bg-white text-gray-800">
                              TEACHER
                            </option>
                          </select>
                          {savingId === u.id && (
                            <span className="text-xs text-gray-400">กำลังบันทึก...</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition shadow-sm"
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