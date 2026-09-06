'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Milestone = {
  id: number
  percent: number
  name: string
  due_date: string | null
}

export default function AdminMilestonesPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, { name: string; due_date: string }>>({})

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
      fetchMilestones()
    } catch {
      router.replace('/login')
    }
  }, [router])

  const fetchMilestones = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/milestones')
      const data = await res.json()
      if (data.success) {
        setMilestones(data.milestones || [])
        const initialDrafts: Record<number, { name: string; due_date: string }> = {}
        for (const m of data.milestones || []) {
          initialDrafts[m.id] = { name: m.name || '', due_date: m.due_date || '' }
        }
        setDrafts(initialDrafts)
      } else {
        alert(data.error || 'ไม่สามารถโหลดไมล์สโตนได้')
      }
    } catch (error) {
      console.error('Fetch milestones error:', error)
      alert('เกิดข้อผิดพลาดในการโหลดไมล์สโตน')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (id: number) => {
    const draft = drafts[id]
    if (!draft) return
    setSavingId(id)
    try {
      const res = await fetch('/api/milestones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: draft.name, due_date: draft.due_date || null }),
      })
      const data = await res.json()
      if (data.success) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === id ? { ...m, name: draft.name, due_date: draft.due_date || null } : m))
        )
        alert('✨ บันทึกเฟสนี้เรียบร้อย!')
      } else {
        alert(data.error || 'บันทึกไม่สำเร็จ')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSavingId(null)
    }
  }

  if (checking || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500 text-sm">
        <p>กำลังโหลดไมล์สโตน...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* ส่วนหัว + ปุ่มกลับหน้าหลัก */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              🧭 จัดการไมล์สโตน / เฟสโครงงาน
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ตั้งชื่อและกำหนดส่งของแต่ละเฟส (25% / 50% / 75% / 100%) ให้ตรงกับแผนการสอนของคุณ
            </p>
          </div>
          <div>
            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition"
            >
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {milestones.map((m) => {
            const draft = drafts[m.id] || { name: '', due_date: '' }
            const isOverdue =
              m.due_date && m.due_date < new Date().toISOString().slice(0, 10)

            return (
              <div
                key={m.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 transition hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-600">
                    {m.percent}%
                  </span>
                  {isOverdue && (
                    <span className="rounded-full bg-red-50 px-3 py-0.5 text-[11px] font-medium text-red-600">
                      🚨 เลยกำหนดแล้ว
                    </span>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">ชื่อเฟส</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [m.id]: { ...draft, name: e.target.value } }))
                    }
                    placeholder="เช่น เสนอหัวข้อโครงงาน / บทที่ 1-2"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    กำหนดส่ง (เว้นว่างได้ถ้ายังไม่กำหนด)
                  </label>
                  <input
                    type="date"
                    value={draft.due_date}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [m.id]: { ...draft, due_date: e.target.value } }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => handleSave(m.id)}
                    disabled={savingId === m.id}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                  >
                    {savingId === m.id ? 'กำลังบันทึก...' : '💾 บันทึกเฟสนี้'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}