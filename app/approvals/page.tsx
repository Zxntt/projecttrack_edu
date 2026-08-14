'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  studentId: string
  fullname: string
}

// 🟢 การส่งงานหนึ่งรอบ (จากตาราง progress_reports)
interface ProgressReport {
  id: number
  progress: number
  description: string
  file_path?: string | null
  teacher_comment?: string | null
  created_at?: string
}

interface Group {
  id: number
  className: string
  groupName: string
  projectName: string
  status: string
  progress: number
  comment?: string
  fileUrl?: string
  members: Member[]
  reports: ProgressReport[]
}

export default function TeacherApprovalsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  
  // 🟢 เพิ่ม 'rejected' เข้าไปใน Type เพื่อให้รองรับสถานะถูกปฏิเสธ
  const [filter, setFilter] = useState<'pending' | 'waiting_review' | 'in_progress' | 'rejected' | 'all'>('pending')

  // State สำหรับ Modal ปฏิเสธ/ให้แก้ไข
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // 🟢 State สำหรับกล่องคอมเมนต์ต่อรายการส่งงาน (key = report.id)
  const [reportComments, setReportComments] = useState<Record<number, string>>({})
  const [savingReportId, setSavingReportId] = useState<number | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null)

  // 🟢 ไมล์สโตน (เฟสโครงงาน) — ใช้เช็คว่ากลุ่มไหนเลยกำหนดส่งแล้วบ้าง
  const [milestones, setMilestones] = useState<any[]>([])

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await fetch('/api/milestones')
        const data = await res.json().catch(() => null)
        if (data?.success) setMilestones(data.milestones || [])
      } catch (error) {
        console.error('Fetch milestones error:', error)
      }
    }
    fetchMilestones()
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const getOverdueMilestone = (groupProgress: number) =>
    milestones.find((m) => m.due_date && m.due_date < today && Number(m.percent) > groupProgress)

  // ดึงรายการกลุ่มตาม Status
  const fetchApprovals = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/approvals?status=${filter}`)
      const text = await res.text()

      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || !res.ok) {
        console.error('API HTML Error Response:', text)
        alert(`เกิดข้อผิดพลาด (${res.status}): เซิร์ฟเวอร์ตอบกลับเป็นหน้า HTML`)
        return
      }

      const data = JSON.parse(text)

      if (data.success) {
        setGroups(data.groups || [])
      } else {
        alert(data.error || 'ไม่สามารถดึงข้อมูลกลุ่มได้')
      }
    } catch (error: any) {
      console.error('Fetch approvals error:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message)
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
    const role = String(user.role || '').trim().toLowerCase()
    if (role !== 'teacher') {
      alert('หน้านี้สำหรับอาจารย์เท่านั้น')
      router.push('/student')
      return
    }

    fetchApprovals()
  }, [filter, router])

  // 🟢 บันทึกคอมเมนต์สำหรับการส่งงานรอบใดรอบหนึ่งโดยเฉพาะ
  const saveReportComment = async (reportId: number) => {
    const teacherComment = (reportComments[reportId] ?? '').trim()
    setSavingReportId(reportId)
    try {
      const res = await fetch('/api/progress-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, teacherComment }),
      })
      const data = await res.json()

      if (data.success) {
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            reports: g.reports?.map((r) =>
              r.id === reportId ? { ...r, teacher_comment: teacherComment } : r
            ),
          }))
        )
      } else {
        alert(data.error || 'บันทึกความเห็นไม่สำเร็จ')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setSavingReportId(null)
    }
  }

  // 🟢 ฟังก์ชันกดเปลี่ยนสถานะฝั่งซ้าย (รอตรวจ <-> ตรวจแล้ว)
  const handleApprove = async (groupId: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          status: 'in_progress', 
          comment: 'ตรวจงานเรียบร้อยแล้ว',
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert('✨ บันทึกสถานะ "ตรวจแล้ว" เรียบร้อย!')
        fetchApprovals()
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันกด "ปฏิเสธ / ให้แก้ไข"
  const handleOpenRejectModal = (groupId: number) => {
    setSelectedGroupId(groupId)
    setCommentText('')
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!selectedGroupId) return
    if (!commentText.trim()) {
      alert('กรุณาระบุเหตุผลหรือสิ่งที่ต้องแก้ไขก่อนครับ')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          status: 'rejected',
          comment: commentText.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert('ส่งข้อเสนอแนะให้แก้ไขเรียบร้อยแล้ว')
        setRejectModalOpen(false)
        fetchApprovals()
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setActionLoading(false)
    }
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
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              🛡️ ศูนย์อนุมัติโครงงาน (อาจารย์)
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              ตรวจสอบ ตรวจทาน และอนุมัติหัวข้อโครงงานนักศึกษา
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20"
            >
              ← กลับหน้าหลัก
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('user')
                router.push('/login')
              }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* 🟢 Filter Tabs (เพิ่ม Tab ถูกปฏิเสธแล้ว) */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'pending', label: '⏳ รออนุมัติงาน/โครงงาน' },
            { id: 'in_progress', label: '✅ ตรวจแล้ว' },
            { id: 'rejected', label: '❌ แก้ไขงาน' },
            { id: 'all', label: '📁 ทั้งหมด' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`rounded-xl px-4 py-2 text-xs font-mono font-medium transition whitespace-nowrap ${
                filter === tab.id
                  ? 'border border-amber-400/40 bg-amber-400/20 text-amber-300'
                  : 'border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex h-64 items-center justify-center font-mono text-sm text-amber-400/70">
            LOADING APPROVALS · กำลังโหลดรายการ...
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
            <p className="font-mono text-slate-500">ไม่พบรายการโครงงานในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100">
                      {group.groupName}
                    </h3>
                    <div className="flex items-center gap-2">
                      {group.status === 'rejected' && (
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-3 py-0.5 text-xs font-mono text-rose-300">
                          ถูกปฏิเสธ
                        </span>
                      )}
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-mono text-cyan-300">
                        {group.className}
                      </span>
                    </div>
                  </div>

                  {getOverdueMilestone(group.progress) && (
                    <div className="mt-2 inline-block rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-0.5 text-[10px] font-mono text-rose-300">
                      🚨 เลยกำหนดเฟส "{getOverdueMilestone(group.progress)?.name}"
                    </div>
                  )}

                  <p className="mt-2 text-sm text-slate-300">
                    <span className="font-semibold text-amber-300">หัวข้อโครงงาน :</span>{' '}
                    {group.projectName}
                  </p>

                  {/* รายชื่อสมาชิก */}
                  <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
                      สมาชิกผู้จัดทำ ({group.members ? group.members.length : 0} คน)
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-300 font-mono">
                      {group.members && group.members.length > 0 ? (
                        group.members.map((m, i) => (
                          <li key={i} className="flex justify-between">
                            <span>• {m.fullname}</span>
                            <span className="text-slate-500">{m.studentId}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-600">ไม่มีสมาชิก</li>
                      )}
                    </ul>
                  </div>

                  {/* 📎 แสดงไฟล์แนบ */}
                  {group.fileUrl ? (
                    <div className="mt-3">
                      <a
                        href={group.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-mono font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                      >
                        📎 เปิดดู / ดาวน์โหลดไฟล์แนบ
                      </a>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-500 font-mono">
                      📄 ยังไม่มีไฟล์แนบในรอบนี้
                    </div>
                  )}

                  {group.comment && (
                    <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-950/20 p-2.5 text-xs text-rose-300 font-mono">
                      💬 ข้อเสนอแนะล่าสุด: "{group.comment}"
                    </div>
                  )}

                  {/* 🟢 ประวัติการส่งงานทีละรอบ */}
                  {group.reports && group.reports.length > 0 && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGroupId(expandedGroupId === group.id ? null : group.id)
                        }
                        className="w-full rounded-xl border border-slate-800/60 bg-slate-950/40 px-3 py-2 text-left text-xs font-mono text-slate-400 hover:text-slate-200"
                      >
                        📜 ประวัติการส่งงาน ({group.reports.length} รอบ){' '}
                        {expandedGroupId === group.id ? '▲' : '▼'}
                      </button>

                      {expandedGroupId === group.id && (
                        <div className="mt-2 space-y-3">
                          {group.reports.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-xl border border-slate-800/60 bg-slate-950/30 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-semibold text-cyan-300">
                                  {r.progress}%
                                </span>
                                {r.created_at && (
                                  <span className="font-mono text-[10px] text-slate-500">
                                    {new Date(r.created_at).toLocaleString('th-TH')}
                                  </span>
                                )}
                              </div>

                              {r.description && (
                                <p className="mt-1 text-xs text-slate-300">{r.description}</p>
                              )}

                              {r.file_path && (
                                <a
                                  href={r.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-block text-[10px] font-mono text-cyan-400 underline underline-offset-2"
                                >
                                  📎 ดูไฟล์แนบของรอบนี้
                                </a>
                              )}

                              <textarea
                                value={reportComments[r.id] ?? r.teacher_comment ?? ''}
                                onChange={(e) =>
                                  setReportComments((prev) => ({
                                    ...prev,
                                    [r.id]: e.target.value,
                                  }))
                                }
                                rows={2}
                                placeholder="เขียนความเห็น/ข้อเสนอแนะสำหรับงานรอบนี้..."
                                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => saveReportComment(r.id)}
                                disabled={savingReportId === r.id}
                                className="mt-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-50"
                              >
                                {savingReportId === r.id ? 'กำลังบันทึก...' : '💾 บันทึกความเห็น'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3 border-t border-slate-800/60 pt-4">
                  <button
                    onClick={() => handleApprove(group.id)}
                    disabled={actionLoading || group.status === 'in_progress'}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                      group.status === 'in_progress'
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 disabled:opacity-80'
                        : 'border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                    }`}
                  >
                    {group.status === 'in_progress' ? '✅ ตรวจแล้ว' : '🔍 รอตรวจ'}
                  </button>

                  <button
                    onClick={() => handleOpenRejectModal(group.id)}
                    disabled={actionLoading}
                    className="flex-1 rounded-xl border border-rose-400/30 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                  >
                    ❌ ปฏิเสธ / ให้แก้ไข
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b0f19] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">
              ❌ ปฏิเสธ / ให้แก้ไขโครงงาน
            </h3>
            <p className="text-xs text-slate-400">
              โปรดระบุข้อเสนอแนะเพื่อให้กลุ่มนักเรียนนำกลับไปแก้ไข
            </p>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              placeholder="เช่น หัวข้อโครงงานกว้างเกินไป ควรปรับระบุขอบเขตให้ชัดเจนขึ้น..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200 focus:border-rose-400 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-300 hover:bg-slate-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="rounded-xl border border-rose-500/30 bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
              >
                ยืนยันการส่งข้อเสนอแนะ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}