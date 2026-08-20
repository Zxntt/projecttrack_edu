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

function statusStyle(status: string) {
  const st = (status || '').trim().toLowerCase()
  switch (st) {
    case 'ผ่าน':
    case 'เสร็จสมบูรณ์':
    case 'approved':
    case 'checked':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.5)]'
    case 'รอตรวจ':
    case 'pending':
    case 'in_progress':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_-2px_rgba(251,191,36,0.5)]'
    case 'ต้องแก้ไข':
    case 'rejected':
      return 'border-rose-400/30 bg-rose-400/10 text-rose-300 shadow-[0_0_12px_-2px_rgba(251,113,133,0.5)]'
    default:
      return 'border-slate-500/30 bg-slate-500/10 text-slate-300'
  }
}

function getStatusLabel(status: string) {
  const st = (status || '').trim().toLowerCase()
  if (st === 'approved' || st === 'ผ่าน' || st === 'เสร็จสมบูรณ์') return '✅ ผ่านการอนุมัติ'
  if (st === 'checked') return '✅ อาจารย์ตรวจแล้ว'
  if (st === 'pending' || st === 'รอตรวจ') return '⏳ รอตรวจ'
  if (st === 'in_progress') return '⏳ กำลังดำเนินการ'
  if (st === 'rejected' || st === 'ต้องแก้ไข') return '❌ ต้องแก้ไข'
  return status || 'ยังไม่ระบุ'
}

// 🟢 คำนวณสถิติของกลุ่มในแต่ละห้อง
function calcRoomStats(list: Group[], milestones: any[]) {
  const total = list.length
  const submitted = list.filter((g) => Number(g.progress || 0) > 0).length
  const pending = list.filter((g) => {
    const st = (g.status || '').toLowerCase()
    return st === 'รอตรวจ' || st === 'pending' || st === 'in_progress'
  }).length
  const approved = list.filter((g) => {
    const st = (g.status || '').toLowerCase()
    return st === 'approved' || st === 'checked' || st === 'ผ่าน' || st === 'เสร็จสมบูรณ์'
  }).length
  const rejected = list.filter((g) => {
    const st = (g.status || '').toLowerCase()
    return st === 'rejected' || st === 'ต้องแก้ไข'
  }).length
  const other = Math.max(total - approved - pending - rejected, 0)

  const today = new Date().toISOString().slice(0, 10)
  const overdue = list.filter((g) =>
    milestones.some(
      (m) => m.due_date && m.due_date < today && Number(m.percent) > Number(g.progress || 0)
    )
  ).length

  const average =
    total > 0 ? list.reduce((sum, g) => sum + Number(g.progress || 0), 0) / total : 0

  return { total, submitted, pending, approved, rejected, other, overdue, average }
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [teacherName, setTeacherName] = useState<string>('')
  const [milestones, setMilestones] = useState<any[]>([])

  // 🔍 State สำหรับ Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [sortBy, setSortBy] = useState<'id-desc' | 'progress-desc' | 'progress-asc'>('id-desc')
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all')

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

  const fetchMilestones = async () => {
    try {
      const res = await fetch('/api/milestones')
      const data = await res.json().catch(() => null)
      if (data?.success) setMilestones(data.milestones || [])
    } catch (error) {
      console.error('Fetch milestones error:', error)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups')
      const data: Group[] = await res.json()
      setGroups(data)
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

  // 🟣 แยกกลุ่มตามหมวด ปวส.2 สายตรง / ปวส.2 ม.6
  const directGroups = groups.filter((g) => (g.class_name || '').includes('สายตรง'))
  const m6Groups = groups.filter(
    (g) => (g.class_name || '').includes('ม.6') && !(g.class_name || '').includes('สายตรง')
  )

  const directStats = calcRoomStats(directGroups, milestones)
  const m6Stats = calcRoomStats(m6Groups, milestones)

  const uniqueClassNames = Array.from(
    new Set(groups.map((g) => g.class_name).filter(Boolean))
  ) as string[]

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
      if (statusFilter === 'pending') matchStatus = st === 'pending' || st === 'รอตรวจ' || st === 'in_progress'
      if (statusFilter === 'approved') matchStatus = st === 'approved' || st === 'checked' || st === 'ผ่าน' || st === 'เสร็จสมบูรณ์'
      if (statusFilter === 'rejected') matchStatus = st === 'rejected' || st === 'ต้องแก้ไข'

      let matchClass = true
      if (selectedClassFilter !== 'all') {
        matchClass = g.class_name === selectedClassFilter
      }

      return matchSearch && matchStatus && matchClass
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
      <div className="mx-auto max-w-7xl space-y-8">
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
              onClick={() => { fetchGroups(); fetchMilestones(); }}
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

        {/* 🟢 ส่วนแสดงผลแบบแยกห้องเรียน */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ClassStatusDonut
            title="🎓 ปวส.2 สายตรง"
            stats={directStats}
            accentColor="cyan"
          />
          <ClassStatusDonut
            title="🎓 ปวส.2 ม.6"
            stats={m6Stats}
            accentColor="violet"
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
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-400 focus:outline-none"
              >
                <option value="all">ห้องเรียนทั้งหมด</option>
                {uniqueClassNames.map((cName, idx) => (
                  <option key={idx} value={cName}>
                    {cName}
                  </option>
                ))}
              </select>

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
                    <tr key={group.id} className="transition hover:bg-slate-800/40">
                      <td className="px-4 py-4 font-medium text-slate-100">
                        <div>{group.name}</div>
                        {group.class_name && (
                          <span className="mt-1 inline-block rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                            {group.class_name}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-300 font-medium max-w-xs truncate">
                        {group.project}
                      </td>

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

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
                            group.status
                          )}`}
                        >
                          {getStatusLabel(group.status)}
                        </span>
                      </td>

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

function ClassStatusDonut({
  title,
  stats,
  accentColor = 'cyan',
}: {
  title: string
  stats: ReturnType<typeof calcRoomStats>
  accentColor?: 'cyan' | 'violet'
}) {
  const { total, submitted, pending, approved, rejected, average } = stats
  const displayTotal = useCountUp(total)

  const segments = [
    { label: 'ผ่านอนุมัติ', value: approved, color: '#34d399' },
    { label: 'รอตรวจ', value: pending, color: '#fbbf24' },
    { label: 'ต้องแก้ไข', value: rejected, color: '#fb7185' },
    { label: 'ยังไม่ส่ง / อื่นๆ', value: stats.other, color: '#334155' },
  ].filter((seg) => seg.value > 0)

  const size = 140
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8
  const strokeWidth = 10

  let cumulative = 0
  const slices = segments.map((seg) => {
    const startAngle = (cumulative / (total || 1)) * 360
    cumulative += seg.value
    const endAngle = (cumulative / (total || 1)) * 360
    const sweep = endAngle - startAngle
    return { ...seg, startAngle, endAngle, sweep }
  })

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h2 className={`flex items-center gap-2 text-lg font-semibold ${accentColor === 'cyan' ? 'text-cyan-300' : 'text-violet-300'}`}>
          {title}
        </h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-mono ${accentColor === 'cyan' ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-violet-400/30 bg-violet-400/10 text-violet-300'}`}>
          {total} กลุ่ม
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />
            {slices.map((s, i) => {
              const circumference = 2 * Math.PI * r
              const strokeDasharray = `${(s.sweep / 360) * circumference} ${circumference}`
              let prevAngle = 0
              for (let j = 0; j < i; j++) {
                prevAngle += slices[j].sweep
              }
              const strokeDashoffset = -((prevAngle / 360) * circumference)

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-mono text-2xl font-bold text-slate-100">{displayTotal}</span>
            <span className="text-[10px] font-mono text-slate-400">กลุ่มทั้งหมด</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            <StatBox color="#38bdf8" label="ส่งความคืบหน้าแล้ว" value={submitted} />
            <StatBox color="#fbbf24" label="รออนุมัติ / ตรวจสอบ" value={pending} />
            <StatBox color="#34d399" label="ผ่านการอนุมัติแล้ว" value={approved} />
            <StatBox color="#fb7185" label="ต้องแก้ไข" value={rejected} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 font-mono text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <span>📊</span> เฉลี่ยทั้งห้อง
            </span>
            <span className="font-bold text-cyan-300 text-sm">{Math.round(average)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 px-3.5 py-2">
      <span className="flex items-center gap-2 text-slate-400 text-[11px]">
        <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-bold text-slate-100">{value}</span>
    </div>
  )
}