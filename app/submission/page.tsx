'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjects } from '../context/ProjectContext'

export default function SubmissionPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [studentCode, setStudentCode] = useState('')
  const { updateProgress } = useProjects()

  // 🔐 ตรวจสิทธิ์: หน้านี้สำหรับนักเรียนเท่านั้น
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.replace('/login')
      return
    }
    try {
      const user = JSON.parse(userStr)
      const role = String(user.role || '').trim().toLowerCase()
      if (role !== 'student') {
        router.replace('/')
        return
      }
      // 🟢 ดึงรหัสนักศึกษาของผู้ใช้ปัจจุบันไว้ใช้ตอนส่งฟอร์ม
      setStudentCode(user.student_code || user.studentId || '')
      setChecking(false)
    } catch {
      router.replace('/login')
    }
  }, [router])

  const [group, setGroup] = useState('กลุ่ม 1')
  const [progress, setProgress] = useState('25')
  const [description, setDescription] = useState('')
  const [github, setGithub] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentCode) {
      alert('ไม่พบรหัสนักศึกษา กรุณาเข้าสู่ระบบใหม่')
      router.replace('/login')
      return
    }

    setSubmitting(true)

    // 🟢 ใช้ FormData เพื่อให้แนบไฟล์ไปด้วยได้จริง (ตรงกับที่ /api/update-progress คาดหวัง)
    const formData = new FormData()
    formData.append('student_code', studentCode)
    formData.append('groupName', group)
    formData.append('progress', progress)
    formData.append('description', description)
    if (github) formData.append('github', github)
    if (file) formData.append('file', file)

    try {
      const res = await fetch('/api/update-progress', {
        method: 'POST',
        // ⚠️ ห้ามตั้ง Content-Type เอง ปล่อยให้ browser ตั้ง multipart boundary ให้อัตโนมัติ
        body: formData,
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.success) {
        alert(data.message || 'ส่งความคืบหน้าเรียบร้อยแล้ว')
        setDescription('')
        setGithub('')
        setFile(null)
      } else {
        alert(data?.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) return null

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-3xl'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-slate-900'>
            ส่งความคืบหน้าโครงงาน
          </h1>
          <p className='mt-1 text-slate-600'>
            กรอกข้อมูลความก้าวหน้าของโปรเจกและแนบไฟล์ประกอบ
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className='space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200'
        >
          <div>
            <label className='mb-2 block text-sm font-medium text-slate-700'>
              กลุ่มนักเรียน
            </label>

            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className='w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none'
            >
              <option>กลุ่ม 1</option>
              <option>กลุ่ม 2</option>
              <option>กลุ่ม 3</option>
              <option>กลุ่ม 4</option>
            </select>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-700'>
              เปอร์เซ็นต์ความคืบหน้า
            </label>

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              {['25', '50', '75', '100'].map((p) => (
                <button
                  key={p}
                  type='button'
                  onClick={() => setProgress(p)}
                  className={`rounded-xl border px-4 py-3 text-center font-semibold transition ${
                    progress === p
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-700'>
              รายละเอียดความคืบหน้า
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder='อธิบายสิ่งที่ทำเสร็จแล้ว เช่น ออกแบบฐานข้อมูล เขียนหน้า Login เชื่อม API เป็นต้น'
              className='w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none'
              required
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-700'>
              GitHub Repository / Demo Link
            </label>

            <input
              type='url'
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder='https://github.com/your-project'
              className='w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none'
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-700'>
              แนบไฟล์ (รูปภาพ / เอกสาร)
            </label>

            <input
              type='file'
              accept='image/*,.pdf,.doc,.docx,.zip'
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className='block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100'
            />

            {file && (
              <p className='mt-2 text-sm text-slate-600'>
                ไฟล์ที่เลือก: <span className='font-medium'>{file.name}</span>
              </p>
            )}
          </div>

          <div className='rounded-xl bg-blue-50 p-4 text-sm text-blue-800'>
            <p className='font-semibold'>ตัวอย่างข้อมูลที่จะส่ง</p>
            <ul className='mt-2 list-disc space-y-1 pl-5'>
              <li>กลุ่ม: {group}</li>
              <li>ความคืบหน้า: {progress}%</li>
              <li>ไฟล์: {file ? file.name : 'ยังไม่ได้เลือกไฟล์'}</li>
            </ul>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
            <button
              type='reset'
              onClick={() => setFile(null)}
              className='rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50'
            >
              ล้างข้อมูล
            </button>

            <button
              type='submit'
              disabled={submitting}
              className='rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50'
            >
              {submitting ? 'กำลังส่ง...' : 'ส่งความคืบหน้า'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}