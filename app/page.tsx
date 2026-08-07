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
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.5)]'
    case 'รอตรวจ':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_-2px_rgba(251,191,36,0.5)]'
    case 'ต้องแก้ไข':
      return 'border-rose-400/30 bg-rose-400/10 text-rose-300 shadow-[0_0_12px_-2px_rgba(251,113,133,0.5)]'
    default:
      return 'border-slate-500/30 bg-slate-500/10 text-slate-300'
  }
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryPoint[]>([])

  const router = useRouter()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'teacher') {
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
  }, [])

  const average =
    groups.length > 0
      ? groups.reduce((sum, g) => sum + Number(g.progress || 0), 0) / groups.length
      : 0

  const submitted = groups.filter((g) => Number(g.progress) > 0).length
  const pending = groups.filter((g) => g.status === 'รอตรวจ').length

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
            </div>
            <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              ⚡ ProjectTrack EDU
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              ระบบติดตามความก้าวหน้าโครงงานนักเรียน
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
              onClick={() => router.push('/newstudent')}
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-medium text-emerald-300 shadow-[0_0_20px_-6px_rgba(125,245,39,0.5)] transition hover:bg-emerald-400/20"
            >
              📋 เพิ่มรายชื่อ
            </button>

            <button
              onClick={() => router.push('/review')}
              className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 font-medium text-amber-300 shadow-[0_0_20px_-6px_rgba(251,191,36,0.5)] transition hover:bg-amber-400/20"
            >
              📋 ตรวจงาน
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
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            label="ส่งแล้ว"
            value={submitted}
            unit="กลุ่ม"
            accent="from-emerald-400 to-emerald-200"
            glow="shadow-[0_0_25px_-8px_rgba(52,211,153,0.6)]"
          />
          <StatCard
            icon="⏳"
            label="รอตรวจ"
            value={pending}
            unit="กลุ่ม"
            accent="from-amber-400 to-amber-200"
            glow="shadow-[0_0_25px_-8px_rgba(251,191,36,0.6)]"
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

        {/* Table */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-100">
              ความก้าวหน้าของแต่ละกลุ่ม
            </h2>
            <span className="font-mono text-xs text-slate-500">
              // {groups.length} records
            </span>
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
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                {groups.map((group) => (
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
                    <td className="px-4 py-4 text-slate-300 font-medium">
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
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
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
                        {group.status}
                      </span>
                    </td>
                  </tr>
                ))}
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