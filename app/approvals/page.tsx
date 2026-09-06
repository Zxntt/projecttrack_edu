'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  studentId: string
  fullname: string
}

interface ProgressReport {
  id: number
  progress: number
  description: string
  file_path?: string | null
  teacher_comment?: string | null
  created_at?: string
}

interface Milestone {
  id: number
  name: string
  percent: number
  due_date?: string
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

type FilterType = 'pending' | 'waiting_review' | 'in_progress' | 'rejected' | 'all'

export default function TeacherApprovalsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pending')

  // State for Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // State for individual report comments
  const [reportComments, setReportComments] = useState<Record<number, string>>({})
  const [savingReportId, setSavingReportId] = useState<number | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null)

  // Milestones tracking
  const [milestones, setMilestones] = useState<Milestone[]>([])

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

  // Fetch groups based on current status filter
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
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error?.message || ''))
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

    try {
      const user = JSON.parse(userStr)
      const role = String(user.role || '').trim().toLowerCase()
      if (role !== 'teacher') {
        alert('หน้านี้สำหรับอาจารย์เท่านั้น')
        router.push('/student')
        return
      }
    } catch {
      router.push('/login')
      return
    }

    fetchApprovals()
  }, [filter, router])

  // Save feedback for a specific progress report submission
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
        alert('บันทึกความเห็นรอบส่งงานเรียบร้อย')
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

  // Approve / Mark as checked
  const handleApprove = async (groupId: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          status: 'checked',
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
    <main className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              🛡️ ศูนย์อนุมัติโครงงาน (อาจารย์)
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ตรวจสอบ ตรวจทาน และอนุมัติหัวข้อโครงงานนักศึกษา
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              ← กลับหน้าหลัก
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('user')
                router.push('/login')
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3">
          {[
            { id: 'pending', label: '⏳ รออนุมัติงาน/โครงงาน' },
            { id: 'in_progress', label: '✅ ตรวจแล้ว' },
            { id: 'rejected', label: '❌ แก้ไขงาน' },
            { id: 'all', label: '📁 ทั้งหมด' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition whitespace-nowrap shadow-sm ${
                filter === tab.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">
            กำลังโหลดรายการ...
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">ไม่พบรายการโครงงานในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groups.map((group) => {
              const isChecked = group.status === 'checked' || group.status === 'in_progress'
              const overdue = getOverdueMilestone(group.progress)

              return (
                <div
                  key={group.id}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">{group.groupName}</h3>
                      <div className="flex items-center gap-2">
                        {group.status === 'rejected' && (
                          <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs text-red-600 font-medium">
                            ถูกปฏิเสธ
                          </span>
                        )}
                        <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs text-blue-600 font-medium">
                          {group.className}
                        </span>
                      </div>
                    </div>

                    {overdue && (
                      <div className="mt-2 inline-block rounded-full bg-red-50 px-3 py-0.5 text-[11px] text-red-600 font-medium">
                        🚨 เลยกำหนดเฟส &quot;{overdue.name}&quot;
                      </div>
                    )}

                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">หัวข้อโครงงาน :</span>{' '}
                      {group.projectName}
                    </p>

                    {/* Members List */}
                    <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        สมาชิกผู้จัดทำ ({group.members ? group.members.length : 0} คน)
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-700">
                        {group.members && group.members.length > 0 ? (
                          group.members.map((m, i) => (
                            <li key={i} className="flex justify-between">
                              <span>• {m.fullname}</span>
                              <span className="text-gray-400">{m.studentId}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">ไม่มีสมาชิก</li>
                        )}
                      </ul>
                    </div>

                    {/* Attachment Link */}
                    {group.fileUrl ? (
                      <div className="mt-3">
                        <a
                          href={group.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                        >
                          📎 เปิดดู / ดาวน์โหลดไฟล์แนบ
                        </a>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-gray-400">
                        📄 ยังไม่มีไฟล์แนบในรอบนี้
                      </div>
                    )}

                    {group.comment && (
                      <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs text-red-600">
                        💬 ข้อเสนอแนะล่าสุด: &quot;{group.comment}&quot;
                      </div>
                    )}

                    {/* History Reports Accordion */}
                    {group.reports && group.reports.length > 0 && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedGroupId(expandedGroupId === group.id ? null : group.id)
                          }
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-600 hover:bg-gray-100"
                        >
                          📜 ประวัติการส่งงาน ({group.reports.length} รอบ){' '}
                          {expandedGroupId === group.id ? '▲' : '▼'}
                        </button>

                        {expandedGroupId === group.id && (
                          <div className="mt-2 space-y-3">
                            {group.reports.map((r) => (
                              <div
                                key={r.id}
                                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-blue-600">
                                    {r.progress}%
                                  </span>
                                  {r.created_at && (
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(r.created_at).toLocaleString('th-TH')}
                                    </span>
                                  )}
                                </div>

                                {r.description && (
                                  <p className="mt-1 text-xs text-gray-600">{r.description}</p>
                                )}

                                {r.file_path && (
                                  <a
                                    href={r.file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-block text-[10px] text-blue-600 underline underline-offset-2"
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
                                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() => saveReportComment(r.id)}
                                  disabled={savingReportId === r.id}
                                  className="mt-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
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
                  <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => handleApprove(group.id)}
                      disabled={actionLoading || isChecked}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                        isChecked
                          ? 'border border-green-200 bg-green-50 text-green-700 disabled:opacity-80'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isChecked ? '✅ ตรวจแล้ว' : '🔍 รอตรวจ'}
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(group.id)}
                      disabled={actionLoading}
                      className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-40"
                    >
                      ❌ ปฏิเสธ / ให้แก้ไข
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">❌ ปฏิเสธ / ให้แก้ไขโครงงาน</h3>
            <p className="text-xs text-gray-500">
              โปรดระบุข้อเสนอแนะเพื่อให้กลุ่มนักเรียนนำกลับไปแก้ไข
            </p>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              placeholder="เช่น หัวข้อโครงงานกว้างเกินไป ควรปรับระบุขอบเขตให้ชัดเจนขึ้น..."
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:border-red-500 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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