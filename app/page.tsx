'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Member = {
  studentId: string
  fullname: string
}

type Group = {
  id: number
  name: string
  project: string
  progress: number
  status: string
  class_name?: string
  members?: Member[]
}

type HistoryPoint = {
  time: string
  value: number
}

const MAX_HISTORY = 20

function statusStyle(status: string) {
  switch (status) {
    case 'ผ่าน':
    case 'เสร็จสมบูรณ์':
    case 'approved':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.5)]'
    case 'รอตรวจ':
    case 'pending':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_-2px_rgba(251,191,36,0.5)]'
    case 'ต้องแก้ไข':
    case 'rejected':
      return 'border-rose-400/30 bg-rose-400/10 text-rose-300 shadow-[0_0_12px_-2px_rgba(251,113,133,0.5)]'
    default:
      return 'border-slate-500/30 bg-slate-500/10 text-slate-300'
  }
}

function getStatusLabel(status: string) {
  if (status === 'approved' || status === 'ผ่าน') return '✅ ผ่านการอนุมัติ'
  if (status === 'pending' || status === 'รอตรวจ') return '⏳ รอตรวจ'
  if (status === 'rejected' || status === 'ต้องแก้ไข') return '❌ ต้องแก้ไข'
  return status || 'ยังไม่ระบุ'
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [teacherName, setTeacherName] = useState<string>('')

  // 🟢 ไมล์สโตน (เฟสโครงงาน) ใช้คำนวณว่ากลุ่มไหนเลยกำหนดส่งแล้วบ้าง
  const [milestones, setMilestones] = useState<any[]>([])

  const fetchMilestones = async () => {
    try {
      const res = await fetch('/api/milestones')
      const data = await res.json().catch(() => null)
      if (data?.success) setMilestones(data.milestones || [])
    } catch (error) {
      console.error('Fetch milestones error:', error)
    }
  }

  // 🔍 State สำหรับ Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [sortBy, setSortBy] = useState<'id-desc' | 'progress-desc' | 'progress-asc'>('id-desc')

  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userStr)
      const role = String(user.role || '').trim().toLowerCase()
      if (role !== 'teacher') {
        router.push('/student')
        return
      }
      setTeacherName(user.name || user.fullname || 'อาจารย์')
    } catch (e) {
      router.push('/login')
    }
  }, [router])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups')
      const data: Group[] = await res.json()
      setGroups(data)

      const avg =
        data.length > 0
          ? data.reduce((sum, g) => sum + Number(g.progress || 0), 0) / data.length
          : 0

      const point: HistoryPoint = {
        time: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: Math.round(avg),
      }

      setHistory((prev) => [...prev, point].slice(-MAX_HISTORY))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  useEffect(() => {
    fetchGroups()
    fetchMilestones()
  }, [])

  const average =
    groups.length > 0
      ? groups.reduce((sum, g) => sum + Number(g.progress || 0), 0) / groups.length
      : 0

  const submitted = groups.filter((g) => Number(g.progress) > 0).length
  const pending = groups.filter((g) => g.status === 'รอตรวจ' || g.status === 'pending').length
  const approved = groups.filter((g) => {
    const st = (g.status || '').toLowerCase()
    return st === 'approved' || g.status === 'ผ่าน' || g.status === 'เสร็จสมบูรณ์'
  }).length

  // 🟢 นับกลุ่มที่ "เลยกำหนดส่ง" อย่างน้อย 1 ไมล์สโตน (มีกำหนดส่งที่ผ่านมาแล้ว แต่ progress ยังไปไม่ถึง)
  const today = new Date().toISOString().slice(0, 10)
  const overdue = groups.filter((g) =>
    milestones.some(
      (m) => m.due_date && m.due_date < today && Number(m.percent) > Number(g.progress || 0)
    )
  ).length

  // 🎯 Filter & Sort Logic
  const filteredGroups = groups
    .filter((g) => {
      const matchSearch =
        (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.project || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.class_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.members?.some(
          (m) =>
            m.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.studentId.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const st = (g.status || '').toLowerCase()
      let matchStatus = true
      if (statusFilter === 'pending') matchStatus = st === 'pending' || st === 'รอตรวจ'
      if (statusFilter === 'approved') matchStatus = st === 'approved' || st === 'ผ่าน' || st === 'เสร็จสมบูรณ์'
      if (statusFilter === 'rejected') matchStatus = st === 'rejected' || st === 'ต้องแก้ไข'

      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === 'progress-desc') return Number(b.progress || 0) - Number(a.progress || 0)
      if (sortBy === 'progress-asc') return Number(a.progress || 0) - Number(b.progress || 0)
      return b.id - a.id
    })

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
          <p className="font-mono text-sm tracking-widest text-cyan-400/70">
            LOADING SYSTEM · กำลังโหลดข้อมูล...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-[#05070d] p-6 text-slate-200"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400/80">
                ระบบออนไลน์ · live sync
              </span>
              {teacherName && (
                <span className="ml-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-0.5 text-[11px] font-mono text-violet-300">
                  👨‍🏫 {teacherName}
                </span>
              )}
            </div>
            <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              ⚡ ProjectTrack EDU
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              ระบบติดตามความก้าวหน้าและศูนย์อนุมัติโครงงานนักเรียน
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchGroups}
              className="group flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-medium text-cyan-300 shadow-[0_0_20px_-6px_rgba(34,211,238,0.6)] transition hover:bg-cyan-400/20"
            >
              <span className="transition group-active:rotate-180">🔄</span>
              รีเฟรชข้อมูล
            </button>

            <button
              onClick={() => router.push('/approvals')}
              className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 font-medium text-amber-300 shadow-[0_0_20px_-6px_rgba(251,191,36,0.5)] transition hover:bg-amber-400/20"
            >
              🛡️ ศูนย์อนุมัติโครงงาน
            </button>

            <button
              onClick={() => router.push('/newstudent')}
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-medium text-emerald-300 shadow-[0_0_20px_-6px_rgba(52,211,153,0.5)] transition hover:bg-emerald-400/20"
            >
              📋 จัดการกลุ่มนักเรียน
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 font-medium text-rose-300 shadow-[0_0_20px_-6px_rgba(251,113,133,0.5)] transition hover:bg-rose-400/20"
            >
              🔐 Logout
            </button>
          </div>
        </div>

        {/* Trend chart */}
        <AverageTrendChart history={history} average={average} />

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            icon="🧩"
            label="จำนวนกลุ่มทั้งหมด"
            value={groups.length}
            unit="กลุ่ม"
            accent="from-slate-400 to-slate-200"
            glow="shadow-[0_0_25px_-8px_rgba(148,163,184,0.5)]"
          />
          <StatCard
            icon="📡"
            label="ส่งความคืบหน้าแล้ว"
            value={submitted}
            unit="กลุ่ม"
            accent="from-emerald-400 to-emerald-200"
            glow="shadow-[0_0_25px_-8px_rgba(52,211,153,0.6)]"
          />
          <StatCard
            icon="⏳"
            label="รออนุมัติ / ตรวจสอบ"
            value={pending}
            unit="กลุ่ม"
            accent="from-amber-400 to-amber-200"
            glow="shadow-[0_0_25px_-8px_rgba(251,191,36,0.6)]"
          />
          <StatCard
            icon="✅"
            label="ผ่านการอนุมัติแล้ว"
            value={approved}
            unit="กลุ่ม"
            accent="from-teal-400 to-teal-200"
            glow="shadow-[0_0_25px_-8px_rgba(45,212,191,0.6)]"
          />
          <StatCard
            icon="🚨"
            label="เลยกำหนดส่ง"
            value={overdue}
            unit="กลุ่ม"
            accent="from-rose-400 to-rose-200"
            glow="shadow-[0_0_25px_-8px_rgba(251,113,133,0.6)]"
          />
          <StatCard
            icon="📊"
            label="เฉลี่ยทั้งห้อง"
            value={`${Math.round(average)}%`}
            unit="ความคืบหน้า"
            accent="from-cyan-400 to-violet-300"
            glow="shadow-[0_0_25px_-8px_rgba(34,211,238,0.6)]"
          />
        </section>

        {/* Table & Controls Section */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                📌 รายชื่อและสถานะความก้าวหน้า
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                แสดงผล {filteredGroups.length} จากทั้งหมด {groups.length} กลุ่ม
              </p>
            </div>

            {/* 🔍 Search Input & Sort Options */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="🔍 ค้นหากลุ่ม, โปรเจกต์, ชื่อผู้จัดทำ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-400 focus:outline-none"
              >
                <option value="id-desc">เรียงตาม: ล่าสุด</option>
                <option value="progress-desc">เรียงตาม: ความคืบหน้า (มาก ➔ น้อย)</option>
                <option value="progress-asc">เรียงตาม: ความคืบหน้า (น้อย ➔ มาก)</option>
              </select>
            </div>
          </div>

          {/* 🏷️ Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
            {[
              { id: 'all', label: '📁 ทั้งหมด' },
              { id: 'pending', label: '⏳ รอตรวจ' },
              { id: 'approved', label: '✅ ผ่านแล้ว' },
              { id: 'rejected', label: '❌ ให้แก้ไข' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-mono transition ${
                  statusFilter === tab.id
                    ? 'border border-cyan-400/40 bg-cyan-400/20 text-cyan-300 font-semibold'
                    : 'border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/60">
            <table className="min-w-full divide-y divide-slate-800/80">
              <thead className="bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">
                    ชื่อกลุ่ม / ห้องเรียน
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">
                    หัวข้อโปรเจกต์
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">
                    รายชื่อผู้จัดทำ
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">
                    ความคืบหน้า
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-slate-500">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-xs uppercase tracking-wider text-slate-500">
                    การกระทำ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-mono text-slate-500 text-xs">
                      🕵️‍♂️ ไม่พบข้อมูลกลุ่มที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="transition hover:bg-slate-800/40"
                    >
                      {/* ชื่อกลุ่ม + แท็กห้องเรียน */}
                      <td className="px-4 py-4 font-medium text-slate-100">
                        <div>{group.name}</div>
                        {group.class_name && (
                          <span className="mt-1 inline-block rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                            {group.class_name}
                          </span>
                        )}
                      </td>

                      {/* หัวข้อโปรเจกต์ */}
                      <td className="px-4 py-4 text-slate-300 font-medium max-w-xs truncate">
                        {group.project}
                      </td>

                      {/* รายชื่อผู้จัดทำ (สมาชิกในกลุ่ม) */}
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        {group.members && group.members.length > 0 ? (
                          <ul className="space-y-1">
                            {group.members.map((m, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-500">
                                  {m.studentId}
                                </span>
                                <span>{m.fullname}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-600 font-mono text-xs">
                            - ไม่มีสมาชิก -
                          </span>
                        )}
                      </td>

                      {/* ความคืบหน้า */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 shadow-[0_0_10px_1px_rgba(34,211,238,0.6)] transition-all"
                              style={{ width: `${group.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm font-semibold text-slate-300">
                            {group.progress}%
                          </span>
                        </div>
                      </td>

                      {/* สถานะ */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
                            group.status
                          )}`}
                        >
                          {getStatusLabel(group.status)}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => router.push('/approvals')}
                          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                        >
                          🔍 ตรวจงาน
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const start = prevRef.current
    const startTime = performance.now()
    let frame: number

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + (target - start) * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        prevRef.current = target
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

function AverageTrendChart({
  history,
  average,
}: {
  history: HistoryPoint[]
  average: number
}) {
  const displayAvg = useCountUp(Math.round(average))

  const width = 800
  const height = 220
  const padX = 40
  const padY = 24
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const points =
    history.length > 1
      ? history
      : history.length === 1
        ? [{ time: '', value: history[0].value }, history[0]]
        : []

  const maxV = 100
  const minV = 0

  const toXY = (i: number, v: number) => {
    const x =
      points.length > 1
        ? padX + (i / (points.length - 1)) * chartW
        : padX + chartW / 2
    const y = padY + chartH - ((v - minV) / (maxV - minV)) * chartH
    return { x, y }
  }

  const linePath = points
    .map((p, i) => {
      const { x, y } = toXY(i, p.value)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const areaPath =
    points.length > 0
      ? `${linePath} L ${toXY(points.length - 1, points[points.length - 1].value).x} ${padY + chartH} L ${toXY(0, points[0].value).x} ${padY + chartH} Z`
      : ''

  const gridLines = [0, 25, 50, 75, 100]
  const last = points[points.length - 1]

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            📈 แนวโน้มค่าเฉลี่ยทั้งห้อง
          </h2>
          <p className="font-mono text-xs text-slate-500">
            อัปเดตทุกครั้งที่รีเฟรชข้อมูล · เก็บย้อนหลัง {MAX_HISTORY} จุด
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5">
          <span className="font-mono text-2xl font-bold tabular-nums text-cyan-300">
            {displayAvg}%
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/70">
            current avg
          </span>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="flex h-40 items-center justify-center font-mono text-sm text-slate-600">
          ยังไม่มีข้อมูลแนวโน้ม · รอรีเฟรชครั้งถัดไป
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {gridLines.map((g) => {
            const y = padY + chartH - (g / 100) * chartH
            return (
              <g key={g}>
                <line
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth={1}
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-600"
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {g}
                </text>
              </g>
            )
          })}

          {areaPath && (
            <path
              key={`area-${history.length}`}
              d={areaPath}
              fill="url(#areaGradient)"
              className="chart-fade-in"
            />
          )}

          <path
            key={`line-${history.length}`}
            d={linePath}
            pathLength={1}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="chart-draw-line"
          />

          {points.map((p, i) => {
            const { x, y } = toXY(i, p.value)
            const isLast = i === points.length - 1
            return (
              <g key={`${p.time}-${i}`}>
                {isLast && (
                  <circle
                    cx={x}
                    cy={y}
                    r={5}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={1.5}
                    className="chart-radar-ping"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isLast ? 5 : 3}
                  fill={isLast ? '#22d3ee' : '#0f172a'}
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  className={isLast ? 'chart-point-pop' : undefined}
                />
              </g>
            )
          })}
        </svg>
      )}

      {last && (
        <p className="mt-1 text-right font-mono text-[11px] text-slate-500">
          last update: {last.time || '—'}
        </p>
      )}

      <style>{`
        .chart-draw-line {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: chart-draw 900ms ease-out forwards;
        }
        @keyframes chart-draw {
          to { stroke-dashoffset: 0; }
        }

        .chart-fade-in {
          opacity: 0;
          animation: chart-fade 900ms ease-out 200ms forwards;
        }
        @keyframes chart-fade {
          to { opacity: 1; }
        }

        .chart-point-pop {
          transform-box: fill-box;
          transform-origin: center;
          animation: chart-pop 500ms ease-out;
        }
        @keyframes chart-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }

        .chart-radar-ping {
          transform-box: fill-box;
          transform-origin: center;
          animation: chart-radar 1.8s ease-out infinite;
        }
        @keyframes chart-radar {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
    </section>
  )
}

function StatCard({
  icon,
  label,
  value,
  unit,
  accent,
  glow,
}: {
  icon: string
  label: string
  value: string | number
  unit: string
  accent: string
  glow: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl ${glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accent}`}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="text-lg opacity-80">{icon}</span>
      </div>
      <p
        className={`mt-2 bg-gradient-to-r ${accent} bg-clip-text font-mono text-3xl font-bold text-transparent`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{unit}</p>
    </div>
  )
}