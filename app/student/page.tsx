'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type StudentData = {
  name: string
  student_code: string
  group_name: string
  project: string
  progress: number
  status: string
}

export default function StudentPage() {
  const router = useRouter()

  const [student, setStudent] = useState<StudentData | null>(null)
  const [progress, setProgress] = useState('25')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ดึงข้อมูลนักเรียน
  const fetchStudentData = async (studentCode: string) => {
    try {
      const res = await fetch(`/api/student?student_code=${studentCode}`)
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`)
      }

      const text = await res.text()
      // ป้องกัน Error Unexpected end of JSON input
      const data = text ? JSON.parse(text) : null

      if (data) {
        // กำหนดค่าเริ่มต้น fallback หากเป็นนักเรียนที่เพิ่งสมัครใหม่และยังไม่มีกลุ่ม
        setStudent({
          name: data.name || 'นักศึกษารายใหม่',
          student_code: data.student_code || studentCode,
          group_name: data.group_name || 'ยังไม่มีกลุ่ม',
          project: data.project || data.project_name || 'ยังไม่ได้ระบุโครงงาน',
          progress: Number(data.progress) || 0,
          status: data.status || 'รอการส่งงาน',
        })
      }
    } catch (error) {
      console.error('Fetch student error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)

    // เช็กสิทธิ์การเข้าถึง
    if (!user.student_code || user.role !== 'student') {
      router.push('/login')
      return
    }

    fetchStudentData(user.student_code)
  }, [router])

  // ฟังก์ชันส่งรายงานความคืบหน้า
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_code: student.student_code,
          groupName: student.group_name,
          progress: Number(progress),
          description: description,
        }),
      })

      const data = await res.json()

      if (data.success || res.ok) {
        alert('ส่งความคืบหน้าเรียบร้อยแล้ว!')
        
        // โหลดข้อมูลล่าสุดใหม่
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.student_code) {
          await fetchStudentData(user.student_code)
        }
        
        setDescription('')
        setProgress('25')
      } else {
        alert(data.message || 'ไม่สามารถส่งความคืบหน้าได้')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-cyan-400 font-mono">
        <p className="animate-pulse">LOADING DATA · กำลังโหลดข้อมูลนักศึกษา...</p>
      </main>
    )
  }

  if (!student) return null

  return (
    <main
      className="min-h-screen bg-[#05070d] p-6 text-slate-200"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              👨‍🎓 Student Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              ระบบติดตามและส่งรายงานความคืบหน้าโครงงาน
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-300 transition hover:bg-rose-500/20"
          >
            🚪 ออกจากระบบ
          </button>
        </div>

        {/* Student Info */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-cyan-300 font-mono border-b border-slate-800 pb-2">
            📌 ข้อมูลนักศึกษา
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-mono text-slate-400">ชื่อ - นามสกุล</p>
              <p className="mt-1 font-medium text-slate-100">{student.name}</p>
            </div>

            <div>
              <p className="text-xs font-mono text-slate-400">รหัสนักศึกษา</p>
              <p className="mt-1 font-mono font-medium text-cyan-400">
                {student.student_code}
              </p>
            </div>

            <div>
              <p className="text-xs font-mono text-slate-400">กลุ่มโครงงาน</p>
              <p className="mt-1 font-medium text-slate-300">{student.group_name}</p>
            </div>

            <div>
              <p className="text-xs font-mono text-slate-400">ชื่อโครงงาน</p>
              <p className="mt-1 font-medium text-slate-300">{student.project}</p>
            </div>
          </div>
        </div>

        {/* Current Progress */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-cyan-300 font-mono border-b border-slate-800 pb-2">
            📊 ความคืบหน้าปัจจุบัน
          </h2>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm font-mono">
                <span className="text-slate-400">เปอร์เซ็นต์งานเสร็จสิ้น</span>
                <span className="font-bold text-cyan-300">{student.progress}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-950 border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                  style={{ width: `${student.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-mono text-slate-400">สถานะล่าสุด:</span>
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 text-xs font-semibold text-amber-300">
                {student.status}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl"
        >
          <h2 className="text-lg font-semibold text-cyan-300 font-mono border-b border-slate-800 pb-2">
            🚀 ส่งความคืบหน้าใหม่
          </h2>

          <div>
            <label className="mb-2 block text-xs font-mono text-slate-400">
              เลือกเปอร์เซ็นต์ความคืบหน้า
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['25', '50', '75', '100'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProgress(p)}
                  className={`rounded-xl border py-3 font-mono font-semibold transition ${
                    progress === p
                      ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-[0_0_15px_-3px_rgba(34,211,238,0.4)]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-mono text-slate-400">
              รายละเอียดงานที่ทำเสร็จ
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              placeholder="อธิบายหัวข้อ หรืองานที่ทำเสร็จแล้วในรอบนี้..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-3.5 font-semibold text-cyan-300 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)] transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {submitting ? 'กำลังส่งข้อมูล...' : '✨ ยืนยันการส่งความคืบหน้า'}
          </button>
        </form>
      </div>
    </main>
  )
}