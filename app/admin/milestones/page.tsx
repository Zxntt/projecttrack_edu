'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-cyan-400 font-mono">
        <p className="animate-pulse">LOADING · กำลังโหลดไมล์สโตน...</p>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-[#05070d] p-6 text-slate-200"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(143, 144, 146, 0.74) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl">
          <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            🧭 จัดการไมล์สโตน / เฟสโครงงาน
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            ตั้งชื่อและกำหนดส่งของแต่ละเฟส (25% / 50% / 75% / 100%) ให้ตรงกับแผนการสอนของคุณ
          </p>
        </div>

        <div className="space-y-4">
          {milestones.map((m) => {
            const draft = drafts[m.id] || { name: '', due_date: '' }
            const isOverdue =
              m.due_date && m.due_date < new Date().toISOString().slice(0, 10)

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-mono font-bold text-cyan-300">
                    {m.percent}%
                  </span>
                  {isOverdue && (
                    <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[10px] font-mono text-rose-300">
                      🚨 เลยกำหนดแล้ว
                    </span>
                  )}
                </div>

                <label className="mb-1 block text-xs font-mono text-slate-400">ชื่อเฟส</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [m.id]: { ...draft, name: e.target.value } }))
                  }
                  placeholder="เช่น เสนอหัวข้อโครงงาน / บทที่ 1-2"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />

                <label className="mb-1 mt-3 block text-xs font-mono text-slate-400">
                  กำหนดส่ง (เว้นว่างได้ถ้ายังไม่กำหนด)
                </label>
                <input
                  type="date"
                  value={draft.due_date}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [m.id]: { ...draft, due_date: e.target.value } }))
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
                />

                <button
                  onClick={() => handleSave(m.id)}
                  disabled={savingId === m.id}
                  className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-50"
                >
                  {savingId === m.id ? 'กำลังบันทึก...' : '💾 บันทึกเฟสนี้'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
