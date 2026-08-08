'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type StudentData = {
  name: string
  student_code: string
  group_name: string
  project: string
  progress: number
  status: string // 'pending' | 'approved' | 'rejected' | 'no_group'
  displayStatus: string
  comment?: string
}

export default function StudentPage() {
  const router = useRouter()

  const [student, setStudent] = useState<StudentData | null>(null)
  const [progress, setProgress] = useState('25')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null) // 📁 State สำหรับเก็บไฟล์แนบ
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ดึงข้อมูลนักเรียน
  const fetchStudentData = async (studentCode: string) => {
    try {
      const res = await fetch(`/api/student?student_code=${studentCode}`)
      const resJson = await res.json()

      if (!res.ok) {
        alert(
          `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${res.status}):\n${
            resJson.error || resJson.message || 'Unknown Error'
          }`
        )
        return
      }

      const data = resJson.data || resJson

      if (data) {
        setStudent({
          name: data.name || 'นักศึกษารายใหม่',
          student_code: data.studentCode || data.student_code || studentCode,
          group_name: data.groupName || data.group_name || 'ยังไม่มีกลุ่ม',
          project: data.project || 'ยังไม่ได้ระบุโครงงาน',
          progress: Number(data.progress) || 0,
          status: data.status || 'no_group',
          displayStatus: data.displayStatus || data.status || 'รอการส่งงาน',
          comment: data.comment || '',
        })
      }
    } catch (error: any) {
      console.error('Fetch student error:', error)
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 🟢 ปรับปรุง useEffect ตรวจเช็ก Auth ให้ใช้ replace และครอบ try-catch กัน crash เวลา Back กลับมา
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.replace('/login')
      return
    }

    try {
      const user = JSON.parse(userStr)

      // ตรวจสอบข้อมูลผู้ใช้เบื้องต้น
      if (!user.student_code && !user.studentCode && user.role !== 'student') {
        router.replace('/login')
        return
      }

      const code = user.student_code || user.studentCode
      if (code) {
        fetchStudentData(code)
      } else {
        router.replace('/login')
      }
    } catch (error) {
      console.error('JSON parse error on Auth check:', error)
      router.replace('/login')
    }
  }, [router])

  // ฟังก์ชันส่งรายงานความคืบหน้า (รองรับทั้ง Text และ File)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    // เช็กสถานะ ต้องเป็น approved เท่านั้น
    if (student.status !== 'approved') {
      alert(
        'โครงงานของคุณต้องได้รับการอนุมัติจากอาจารย์ก่อน จึงจะสามารถส่งความคืบหน้าได้'
      )
      return
    }

    setSubmitting(true)
    try {
      // ใช้ FormData สำหรับส่งไฟล์
      const formData = new FormData()
      formData.append('student_code', student.student_code)
      formData.append('groupName', student.group_name)
      formData.append('progress', progress)
      formData.append('description', description)
      
      // แนบไฟล์เข้าไปด้วยหากมีการเลือกไฟล์
      if (file) {
        formData.append('file', file)
      }

      const res = await fetch('/api/update-progress', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success || res.ok) {
        alert('✨ ส่งความคืบหน้าและแนบไฟล์เรียบร้อยแล้ว!')

        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          const code = user.student_code || user.studentCode
          if (code) {
            await fetchStudentData(code)
          }
        }

        // ล้างค่าฟอร์ม
        setDescription('')
        setFile(null)
        setProgress('25')
      } else {
        alert(data.message || data.error || 'ไม่สามารถส่งความคืบหน้าได้')
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
    router.replace('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-cyan-400 font-mono">
        <p className="animate-pulse">LOADING DATA · กำลังโหลดข้อมูลนักศึกษา...</p>
      </main>
    )
  }

  if (!student) return null

  const isApproved = student.status === 'approved'

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

          <div className="flex gap-2">
            {/* 🟢 ปุ่มกลับหน้าหลัก */}
            <button
              onClick={() => router.push('/')}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              🏠 หน้าหลัก
            </button>

            <button
              onClick={() => router.push('/newstudent')}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-medium text-cyan-300 transition hover:bg-cyan-400/20 text-xs"
            >
              📋 จัดการกลุ่ม
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-300 transition hover:bg-rose-500/20 text-xs"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {student.status === 'no_group' && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-200 backdrop-blur-xl">
            <h3 className="font-bold flex items-center gap-2">⚠️ คุณยังไม่มีกลุ่มโครงงาน</h3>
            <p className="mt-1 text-xs text-amber-300/80">
              กรุณาไปที่หน้าจัดตั้งกลุ่มเพื่อเสนอชื่อโครงงานและเลือกสมาชิกในกลุ่ม
            </p>
            <button
              onClick={() => router.push('/newstudent')}
              className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/20 px-4 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-400/30"
            >
              👉 ไปหน้าสร้างกลุ่มโครงงาน
            </button>
          </div>
        )}

        {student.status === 'pending' && (
          <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-5 text-sky-200 backdrop-blur-xl">
            <h3 className="font-bold flex items-center gap-2">⏳ โครงงานอยู่ระหว่างรออาจารย์อนุมัติ</h3>
            <p className="mt-1 text-xs text-sky-300/80">
              เมื่ออาจารย์อนุมัติหัวข้อโครงงานแล้ว ระบบจะปลดล็อกฟอร์มส่งรายงานความคืบหน้าให้โดยอัตโนมัติ
            </p>
          </div>
        )}

        {student.status === 'rejected' && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-rose-200 backdrop-blur-xl">
            <h3 className="font-bold flex items-center gap-2">❌ โครงงานไม่ผ่านการอนุมัติ / ให้แก้ไข</h3>
            {student.comment && (
              <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 font-mono">
                💬 ข้อเสนอแนะจากอาจารย์: "{student.comment}"
              </div>
            )}
            <button
              onClick={() => router.push('/newstudent')}
              className="mt-3 rounded-xl border border-rose-400/40 bg-rose-400/20 px-4 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-400/30"
            >
              ✏️ แก้ไขข้อมูลกลุ่มโครงงาน
            </button>
          </div>
        )}

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
              <span className="text-xs font-mono text-slate-400">สถานะอนุมัติ:</span>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                  isApproved
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : student.status === 'rejected'
                    ? 'border-rose-400/30 bg-rose-400/10 text-rose-300'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                }`}
              >
                {student.displayStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Form (เปิดให้ส่งเมื่อ status === 'approved') */}
        <form
          onSubmit={handleSubmit}
          className={`space-y-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl transition ${
            !isApproved ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-lg font-semibold text-cyan-300 font-mono">
              🚀 ส่งความคืบหน้าใหม่
            </h2>
            {!isApproved && (
              <span className="text-xs text-rose-400 font-mono">
                🔒 ปลดล็อกเมื่อโครงงานได้รับการอนุมัติ
              </span>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-mono text-slate-400">
              เลือกเปอร์เซ็นต์ความคืบหน้า
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['25', '50', '75', '100'].map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={!isApproved}
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
              disabled={!isApproved}
              rows={4}
              required
              placeholder="อธิบายหัวข้อ หรืองานที่ทำเสร็จแล้วในรอบนี้..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* 📁 ช่องแนบไฟล์เอกสารเพิ่มเติม */}
          <div>
            <label className="mb-2 block text-xs font-mono text-slate-400">
              📎 แนบไฟล์เอกสาร/รายงาน (PDF, DOCX, ZIP หรือรูปภาพ)
            </label>
            <input
              type="file"
              disabled={!isApproved}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/10 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-cyan-300 hover:file:bg-cyan-500/20 cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-2"
            />
            {file && (
              <p className="mt-2 text-xs text-emerald-400 font-mono">
                ✓ ไฟล์ที่เลือก: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !isApproved}
            className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-3.5 font-semibold text-cyan-300 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)] transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {submitting ? 'กำลังส่งข้อมูล...' : '✨ ยืนยันการส่งความคืบหน้า'}
          </button>
        </form>
      </div>
    </main>
  )
}