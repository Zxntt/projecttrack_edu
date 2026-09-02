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
      return 'border-emerald-600/20 bg-emerald-50 text-emerald-700'
    case 'รอตรวจ':
    case 'pending':
    case 'in_progress':
      return 'border-amber-600/20 bg-amber-50 text-amber-700'
    case 'ต้องแก้ไข':
    case 'rejected':
      return 'border-rose-600/20 bg-rose-50 text-rose-700'
    default:
      return 'border-slate-300 bg-slate-50 text-slate-500'
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
      <main className="flex min-h-screen items-center justify-center bg-[#F4F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0B1F3A]/15 border-t-[#0B1F3A]" />
          <p className="text-sm tracking-wide text-[#0B1F3A]/60">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-[#DAEBF7] p-6 text-[#1B2431]"
      style={{
        fontFamily: "'Noto Sans Thai', 'IBM Plex Sans Thai', system-ui, sans-serif",
        backgroundImage:
          'radial-gradient(circle at 1px 1px, #0b1f3a12 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
        .font-display {
          font-family: 'Noto Serif Thai', serif;
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c93e] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c93e]" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#0B1F3A]/50">
                ระบบออนไลน์ · live sync
              </span>
              {teacherName && (
                <span className="ml-2 rounded-full border border-[#0B1F3A]/15 bg-[#0B1F3A]/[0.04] px-2.5 py-0.5 text-[11px] text-[#0B1F3A]/80">
                  👨‍🏫 {teacherName}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#0B1F3A]">
              ProjectTrack EDU
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ระบบติดตามความก้าวหน้าและศูนย์อนุมัติโครงงานนักเรียน
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { fetchGroups(); fetchMilestones(); }}
              className="group flex items-center gap-2 rounded-xl border border-[#0B1F3A]/15 bg-white px-4 py-2 font-medium text-[#0B1F3A] transition hover:bg-[#0B1F3A]/[0.04]"
            >
              <span className="transition group-active:rotate-180">↻</span>
              รีเฟรชข้อมูล
            </button>

            <button
              onClick={() => router.push('/approvals')}
              className="flex items-center gap-2 rounded-xl border border-[#B08D57]/40 bg-[#B08D57]/10 px-4 py-2 font-medium text-[#8A6A3E] transition hover:bg-[#B08D57]/20"
            >
              🛡️ ศูนย์อนุมัติโครงงาน
            </button>

            <button
              onClick={() => router.push('/newstudent')}
              className="flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-4 py-2 font-medium text-white transition hover:bg-[#132A4C]"
            >
              📋 จัดการกลุ่มนักเรียน
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-medium text-rose-600 transition hover:bg-rose-100"
            >
              🔐 Logout
            </button>
          </div>
        </div>

        {/* 🟢 ส่วนแสดงผลแบบแยกห้องเรียน */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ClassStatusDonut
            title="ปวส.2 สายตรง"
            stats={directStats}
            accentColor="navy"
          />
          <ClassStatusDonut
            title="ปวส.2 ม.6"
            stats={m6Stats}
            accentColor="navy"
          />
        </section>

        {/* Table & Controls Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)] space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#0B1F3A] flex items-center gap-2">
                รายชื่อและสถานะความก้าวหน้า
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                แสดงผล {filteredGroups.length} จากทั้งหมด {groups.length} กลุ่ม
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="ค้นหากลุ่ม, โปรเจกต์, ชื่อผู้จัดทำ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-2 text-xs text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-[#F7F8FB] px-3 py-2 text-xs text-[#0B1F3A]/80 focus:border-[#0B1F3A]/40 focus:outline-none"
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
                className="rounded-xl border border-slate-200 bg-[#F7F8FB] px-3 py-2 text-xs text-[#0B1F3A]/80 focus:border-[#0B1F3A]/40 focus:outline-none"
              >
                <option value="id-desc">เรียงตาม: ล่าสุด</option>
                <option value="progress-desc">เรียงตาม: ความคืบหน้า (มาก ➔ น้อย)</option>
                <option value="progress-asc">เรียงตาม: ความคืบหน้า (น้อย ➔ มาก)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'pending', label: 'รอตรวจ' },
              { id: 'approved', label: 'ผ่านแล้ว' },
              { id: 'rejected', label: 'ให้แก้ไข' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`rounded-xl px-3.5 py-1.5 text-xs transition ${
                  statusFilter === tab.id
                    ? 'border border-[#0B1F3A]/25 bg-[#0B1F3A]/[0.06] text-[#0B1F3A] font-semibold'
                    : 'border border-slate-200 bg-white text-slate-500 hover:text-[#0B1F3A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-[#F7F8FB]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">
                    ชื่อกลุ่ม / ห้องเรียน
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">
                    หัวข้อโปรเจกต์
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">
                    รายชื่อผู้จัดทำ
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">
                    ความคืบหน้า
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-slate-500">
                    การกระทำ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      ไม่พบข้อมูลกลุ่มที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => (
                    <tr key={group.id} className="transition hover:bg-[#0B1F3A]/[0.025]">
                      <td className="px-4 py-4 font-medium text-[#0B1F3A]">
                        <div>{group.name}</div>
                        {group.class_name && (
                          <span className="mt-1 inline-block rounded border border-[#0B1F3A]/15 bg-[#0B1F3A]/[0.04] px-2 py-0.5 text-[10px] text-[#0B1F3A]/70">
                            {group.class_name}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600 font-medium max-w-xs truncate">
                        {group.project}
                      </td>

                      <td className="px-4 py-4 text-slate-500 text-sm">
                        {group.members && group.members.length > 0 ? (
                          <ul className="space-y-1">
                            {group.members.map((m, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  {m.studentId}
                                </span>
                                <span>{m.fullname}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            - ไม่มีสมาชิก -
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#0B1F3A] transition-all"
                              style={{ width: `${group.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-[#0B1F3A]">
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
                          className="rounded-lg border border-[#0B1F3A]/15 bg-white px-3 py-1 text-xs font-medium text-[#0B1F3A] transition hover:bg-[#0B1F3A]/[0.05]"
                        >
                          ตรวจงาน
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
  accentColor = 'navy',
}: {
  title: string
  stats: ReturnType<typeof calcRoomStats>
  accentColor?: 'navy' | 'gold'
}) {
  const { total, submitted, pending, approved, rejected, average } = stats
  const displayTotal = useCountUp(total)

  const segments = [
    { label: 'ผ่านอนุมัติ', value: approved, color: '#11e268' },
    { label: 'รอตรวจ', value: pending, color: '#B08D57' },
    { label: 'ต้องแก้ไข', value: rejected, color: '#C05B5B' },
    { label: 'ยังไม่ส่ง / อื่นๆ', value: stats.other, color: '#E2E6EC' },
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

  const titleColor = accentColor === 'navy' ? 'text-[#0B1F3A]' : 'text-[#8A6A3E]'
  const badgeColor =
    accentColor === 'navy'
      ? 'border-[#0B1F3A]/15 bg-[#0B1F3A]/[0.04] text-[#0B1F3A]'
      : 'border-[#B08D57]/30 bg-[#B08D57]/10 text-[#8A6A3E]'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)] space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className={`font-display flex items-center gap-2 text-lg font-semibold ${titleColor}`}>
          {title}
        </h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs ${badgeColor}`}>
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
              stroke="#EEF1F5"
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
            <span className="font-display text-2xl font-bold text-[#0B1F3A]">{displayTotal}</span>
            <span className="text-[10px] text-slate-400">กลุ่มทั้งหมด</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <StatBox color="#5C7699" label="ส่งความคืบหน้าแล้ว" value={submitted} />
            <StatBox color="#B08D57" label="รออนุมัติ / ตรวจสอบ" value={pending} />
            <StatBox color="#11e268" label="ผ่านการอนุมัติแล้ว" value={approved} />
            <StatBox color="#C05B5B" label="ต้องแก้ไข" value={rejected} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-2.5 text-xs">
            <span className="flex items-center gap-2 text-slate-500">
              เฉลี่ยทั้งห้อง
            </span>
            <span className="font-bold text-[#0B1F3A] text-sm">{Math.round(average)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2">
      <span className="flex items-center gap-2 text-slate-500 text-[11px]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-bold text-[#0B1F3A]">{value}</span>
    </div>
  )
}