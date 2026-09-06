'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type StudentData = {
  name: string
  student_code: string
  group_name: string
  project: string
  progress: number
  status: string // 'pending' | 'waiting_review' | 'checked' | 'rejected' | 'no_group'
  displayStatus: string
  comment?: string
  group_id?: number | null
}

// 🟢 ประวัติการส่งงานหนึ่งรายการ (จากตาราง progress_reports)
type ProgressReport = {
  id?: number
  progress: number
  description: string
  file_path?: string | null
  teacher_comment?: string | null
  created_at?: string
}

export default function StudentPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null) // 🟢 เพิ่ม useRef สำหรับจัดการ input file

  const [student, setStudent] = useState<StudentData | null>(null)
  const [progress, setProgress] = useState('25')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 🟢 เช็คงานว่ากลุ่มนี้ส่งงาน (เปอร์เซ็นต์ไหน) ไปแล้วบ้าง
  const [submittedLevels, setSubmittedLevels] = useState<number[]>([])
  const [reportHistory, setReportHistory] = useState<ProgressReport[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // 🟢 ไมล์สโตน (เฟสโครงงาน) — ชื่อ/กำหนดส่งของแต่ละเปอร์เซ็นต์
  const [milestones, setMilestones] = useState<any[]>([])

  // 🟢 กำหนดขนาดไฟล์สูงสุด (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024

  // 🟢 ฟังก์ชันตรวจสอบขนาดไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      alert('⚠️ ไฟล์ขนาดใหญ่เกินไป (จำกัดไม่เกิน 10MB)')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setFile(null)
      return
    }
    setFile(selectedFile)
  }

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await fetch('/api/milestones', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (data?.success) setMilestones(data.milestones || [])
      } catch (error) {
        console.error('Fetch milestones error:', error)
      }
    }
    fetchMilestones()
  }, [])

  const getMilestone = (percent: string) => milestones.find((m) => Number(m.percent) === Number(percent))
  const today = new Date().toISOString().slice(0, 10)

  const fetchSubmissionHistory = async (groupId?: number | null, groupName?: string) => {
    if (!groupId && !groupName) return
    setHistoryLoading(true)
    try {
      const query = groupId
        ? `group_id=${groupId}`
        : `groupName=${encodeURIComponent(groupName || '')}`
      // 🟢 ป้องกัน Cache เพื่อให้ได้ประวัติล่าสุดเสมอ
      const res = await fetch(`/api/progress-reports?${query}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)

      if (data?.success) {
        setSubmittedLevels(data.submittedLevels || [])
        setReportHistory(data.reports || [])
      }
    } catch (error) {
      console.error('Fetch submission history error:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchStudentData = async (studentCode: string) => {
    try {
      // 🟢 เพิ่ม { cache: 'no-store' } เพื่อไม่ให้เบราว์เซอร์จำค่าเก่าและอัปเดตเปอร์เซ็นต์ทันที
      const res = await fetch(`/api/student?student_code=${studentCode}`, { cache: 'no-store' })
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
        const groupId = data.groupId || data.group_id || null
        const groupName = data.groupName || data.group_name || 'ยังไม่มีกลุ่ม'

        setStudent({
          name: data.name || 'นักศึกษารายใหม่',
          student_code: data.studentCode || data.student_code || studentCode,
          group_name: groupName,
          project: data.project || 'ยังไม่ได้ระบุโครงงาน',
          progress: Number(data.progress) || 0,
          status: data.status || 'no_group',
          displayStatus: data.displayStatus || data.status || 'รอการส่งงาน',
          comment: data.comment || '',
          group_id: groupId,
        })

        if (groupId || (groupName && groupName !== 'ยังไม่มีกลุ่ม')) {
          fetchSubmissionHistory(groupId, groupName)
        }
      }
    } catch (error: any) {
      console.error('Fetch student error:', error)
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.replace('/login')
      return
    }

    try {
      const user = JSON.parse(userStr)
      const role = String(user.role || '').trim().toLowerCase()

      if (role === 'teacher') {
        router.replace('/')
        return
      }

      if (!user.student_code && !user.studentCode && role !== 'student') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    if (submittedLevels.includes(Number(progress))) {
      const confirmResend = confirm(
        `⚠️ งาน ${progress}% นี้เคยถูกส่งไปแล้ว ต้องการส่งซ้ำ (อัปเดตข้อมูลใหม่) หรือไม่?`
      )
      if (!confirmResend) return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('student_code', student.student_code)
      formData.append('groupName', student.group_name)
      formData.append('progress', progress)
      formData.append('description', description)

      if (file) {
        formData.append('file', file)
      }

      const res = await fetch('/api/update-progress', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        const debugInfo = data.debug
          ? `\n\n[Debug]\nไฟล์ที่เซิร์ฟเวอร์ได้รับ: ${
              data.debug.fileDebug?.received
                ? `${data.debug.fileDebug.name} (${data.debug.fileDebug.size} bytes)`
                : 'ไม่ได้รับไฟล์เลย'
            }\nfile_url ที่บันทึก: ${data.debug.savedFileUrl || data.fileUrl || 'ไม่มี'}`
          : ''

        alert('✨ ส่งความคืบหน้าและแนบไฟล์เรียบร้อยแล้ว!' + debugInfo)

        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          const code = user.student_code || user.studentCode
          if (code) {
            await fetchStudentData(code)
          }
        }

        setDescription('')
        setFile(null)
        setProgress('25')

        // 🟢 เคลียร์ค่าในช่องเลือกไฟล์หลังจากส่งสำเร็จ
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        fetchSubmissionHistory(student.group_id, student.group_name)
      } else {
        const debugInfo = data.debug
          ? `\n\n[Debug]\nไฟล์ที่เซิร์ฟเวอร์ได้รับ: ${
              data.debug.fileDebug?.received
                ? `${data.debug.fileDebug.name} (${data.debug.fileDebug.size} bytes)`
                : 'ไม่ได้รับไฟล์เลย'
            }`
          : ''
        alert((data.error || data.message || 'ไม่สามารถส่งความคืบหน้าได้') + debugInfo)
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
      <main className="flex min-h-screen items-center justify-center bg-[#F4F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0B1F3A]/15 border-t-[#0B1F3A]" />
          <p className="text-sm tracking-wide text-[#0B1F3A]/60">
            กำลังโหลดข้อมูลนักศึกษา...
          </p>
        </div>
      </main>
    )
  }

  if (!student) return null

  const isProjectCompleted = student.status === 'checked' && student.progress >= 100
  const canSubmit = student.status !== 'no_group' && !isProjectCompleted

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

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
            {/* 🟢 โลโก้ Information Technology Chiangmai Technical College */}
            <img
              src="/pic/2.png"
              alt="Information Technology Chiangmai Technical College"
              className="h-15 w-auto object-contain sm:h-18"
            />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#0B1F3A]">
                Student Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                ระบบติดตามและส่งรายงานความคืบหน้าโครงงาน
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/newstudent')}
              className="rounded-xl border border-[#0B1F3A]/15 bg-white px-4 py-2 text-xs font-medium text-[#0B1F3A] transition hover:bg-[#0B1F3A]/[0.04]"
            >
              📋 จัดการกลุ่ม
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {student.status === 'no_group' && (
          <div className="rounded-2xl border border-amber-600/20 bg-amber-50 p-5 text-amber-800 shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
            <h3 className="font-bold flex items-center gap-2">⚠️ คุณยังไม่มีกลุ่มโครงงาน</h3>
            <p className="mt-1 text-xs text-amber-700/80">
              กรุณาไปที่หน้าจัดตั้งกลุ่มเพื่อเสนอชื่อโครงงานและเลือกสมาชิกในกลุ่ม
            </p>
            <button
              onClick={() => router.push('/newstudent')}
              className="mt-3 rounded-xl border border-amber-600/30 bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200"
            >
              👉 ไปหน้าสร้างกลุ่มโครงงาน
            </button>
          </div>
        )}

        {student.status === 'pending' && (
          <div className="rounded-2xl border border-sky-600/20 bg-sky-50 p-5 text-sky-800 shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
            <h3 className="font-bold flex items-center gap-2">⏳ โครงงานอยู่ระหว่างรออาจารย์ตรวจสอบ</h3>
            <p className="mt-1 text-xs text-sky-700/80">
              คุณสามารถส่งรายงานความคืบหน้าเพิ่มเติม หรือแก้ไขข้อมูลได้
            </p>
          </div>
        )}

        {student.status === 'waiting_review' && (
          <div className="rounded-2xl border border-[#0B1F3A]/15 bg-[#0B1F3A]/[0.04] p-5 text-[#0B1F3A] shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
            <h3 className="font-bold flex items-center gap-2">🔍 งานล่าสุดของคุณอยู่ระหว่างรออาจารย์ตรวจ</h3>
            <p className="mt-1 text-xs text-[#0B1F3A]/70">
              คุณยังส่งรายงานความคืบหน้ารอบถัดไปได้ตามปกติ
            </p>
          </div>
        )}

        {student.status === 'checked' && !isProjectCompleted && (
          <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50 p-5 text-emerald-800 shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
            <h3 className="font-bold flex items-center gap-2">✅ อาจารย์ตรวจงานรอบล่าสุดแล้ว</h3>
            <p className="mt-1 text-xs text-emerald-700/80">
              คุณสามารถส่งรายงานความคืบหน้ารอบถัดไปได้เลย
            </p>
          </div>
        )}

        {isProjectCompleted && (
          <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50 p-5 text-emerald-800 shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
            <h3 className="font-bold flex items-center gap-2">🎉 โครงงานเสร็จสมบูรณ์แล้ว</h3>
            <p className="mt-1 text-xs text-emerald-700/80">
              งาน 100% ได้รับการตรวจเรียบร้อยแล้ว ฟอร์มส่งงานถูกปิดการใช้งาน
            </p>
          </div>
        )}

        {student.status === 'rejected' && (
          <div className="rounded-2xl border border-rose-600/20 bg-rose-50 p-5 text-rose-800 shadow-[0_1px_2px_rgba(11,31,58,0.04)]">
            <h3 className="font-bold flex items-center gap-2">❌ โครงงานต้องแก้ไข</h3>
            {student.comment && (
              <div className="mt-2 rounded-xl border border-rose-600/20 bg-rose-100/60 p-3 text-xs text-rose-800">
                💬 ข้อเสนอแนะจากอาจารย์: "{student.comment}"
              </div>
            )}
            <p className="mt-2 text-xs text-rose-700/80">
              ฟอร์มส่งงานเปิดให้คุณแก้ไขและส่งงานใหม่ได้แล้วด้านล่างนี้
            </p>
          </div>
        )}

        {/* Student Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)]">
          <h2 className="mb-4 text-lg font-semibold text-[#0B1F3A] border-b border-slate-200 pb-2">
            📌 ข้อมูลนักศึกษา
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">ชื่อ - นามสกุล</p>
              <p className="mt-1 font-medium text-[#0B1F3A]">{student.name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">รหัสนักศึกษา</p>
              <p className="mt-1 font-medium text-[#0B1F3A]">
                {student.student_code}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">กลุ่มโครงงาน</p>
              <p className="mt-1 font-medium text-slate-700">{student.group_name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">ชื่อโครงงาน</p>
              <p className="mt-1 font-medium text-slate-700">{student.project}</p>
            </div>
          </div>
        </div>

        {/* Current Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)]">
          <h2 className="mb-4 text-lg font-semibold text-[#0B1F3A] border-b border-slate-200 pb-2">
            📊 ความคืบหน้าปัจจุบัน
          </h2>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-500">เปอร์เซ็นต์งานเสร็จสิ้น</span>
                <span className="font-bold text-[#0B1F3A]">{student.progress}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                <div
                  className="h-full rounded-full bg-[#0B1F3A] transition-all duration-500"
                  style={{ width: `${student.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">สถานะอนุมัติ:</span>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                  student.status === 'checked'
                    ? 'border-emerald-600/20 bg-emerald-50 text-emerald-700'
                    : student.status === 'rejected'
                    ? 'border-rose-600/20 bg-rose-50 text-rose-700'
                    : 'border-amber-600/20 bg-amber-50 text-amber-700'
                }`}
              >
                {student.displayStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Form */}
        <form
          onSubmit={handleSubmit}
          className={`space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)] transition ${
            !canSubmit ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-lg font-semibold text-[#0B1F3A]">
              🚀 ส่งความคืบหน้าใหม่
            </h2>
            {!canSubmit && (
              <span className="text-xs text-rose-600 font-medium">
                🔒 ฟอร์มถูกล็อก
              </span>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              เลือกเปอร์เซ็นต์ความคืบหน้า
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['25', '50', '75', '100'].map((p) => {
                const isSubmitted = submittedLevels.includes(Number(p))
                const milestone = getMilestone(p)
                const isOverdue =
                  milestone?.due_date && milestone.due_date < today && !isSubmitted
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => setProgress(p)}
                    title={milestone?.name || ''}
                    className={`relative rounded-xl border py-3 font-semibold transition ${
                      progress === p
                        ? 'border-[#0B1F3A]/25 bg-[#0B1F3A]/[0.06] text-[#0B1F3A]'
                        : 'border-slate-200 bg-white text-slate-500 hover:text-[#0B1F3A]'
                    }`}
                  >
                    {p}%
                    {isSubmitted && (
                      <span className="absolute -top-2 -right-2 rounded-full border border-emerald-600/30 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                        ✔ ส่งแล้ว
                      </span>
                    )}
                    {!isSubmitted && isOverdue && (
                      <span className="absolute -top-2 -right-2 rounded-full border border-rose-600/30 bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">
                        🚨 เลยกำหนด
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {getMilestone(progress) && (
              <p className="mt-2 text-xs text-slate-500">
                📌 {getMilestone(progress)?.name}
                {getMilestone(progress)?.due_date && (
                  <span className="ml-2 text-slate-400">
                    (กำหนดส่ง: {getMilestone(progress)?.due_date})
                  </span>
                )}
              </p>
            )}

            {submittedLevels.includes(Number(progress)) && (
              <p className="mt-2 text-xs text-emerald-700">
                ✔ งาน {progress}% นี้กลุ่มของคุณส่งไปแล้ว — ถ้าส่งอีกครั้งจะเป็นการอัปเดตข้อมูลเดิม
              </p>
            )}
          </div>

          {/* ประวัติการส่งงานของกลุ่ม */}
          {(historyLoading || reportHistory.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-[#F7F8FB] p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                📜 ประวัติงานที่กลุ่มนี้ส่งไปแล้ว
              </p>
              {historyLoading ? (
                <p className="text-xs text-slate-400">กำลังโหลด...</p>
              ) : (
                <ul className="space-y-2">
                  {reportHistory.map((r, i) => (
                    <li
                      key={r.id ?? i}
                      className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-[#0B1F3A]">
                          {r.progress}%
                        </span>
                        {r.description && (
                          <p className="mt-0.5 truncate text-slate-500">{r.description}</p>
                        )}
                        {r.teacher_comment && (
                          <p className="mt-1 rounded-md border border-amber-600/20 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                            💬 อาจารย์: {r.teacher_comment}
                          </p>
                        )}
                      </div>
                      {r.created_at && (
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              รายละเอียดงานที่ทำเสร็จ
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canSubmit}
              rows={4}
              required
              placeholder="อธิบายหัวข้อ หรืองานที่ทำเสร็จแล้วในรอบนี้..."
              className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] p-4 text-sm text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
            />
          </div>

          {/* 📁 ช่องแนบไฟล์เอกสารเพิ่มเติม */}
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              📎 แนบไฟล์เอกสาร/รายงาน (PDF, DOCX, ZIP หรือรูปภาพ - สูงสุด 10MB)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              disabled={!canSubmit}
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-[#0B1F3A]/[0.06] file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-[#0B1F3A] hover:file:bg-[#0B1F3A]/[0.1] cursor-pointer rounded-xl border border-slate-200 bg-[#F7F8FB] p-2"
            />
            {file && (
              <p className="mt-2 text-xs text-emerald-700">
                ✓ ไฟล์ที่เลือก: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="w-full rounded-xl bg-[#0B1F3A] py-3.5 font-semibold text-white transition hover:bg-[#132A4C] disabled:opacity-50"
          >
            {submitting ? 'กำลังส่งข้อมูล...' : '✨ ยืนยันการส่งความคืบหน้า'}
          </button>
        </form>
      </div>
    </main>
  )
}