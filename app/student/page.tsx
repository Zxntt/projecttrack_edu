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

  useEffect(() => {
    // จำลองผู้ใช้ที่ล็อกอิน
    const user = JSON.parse(
      localStorage.getItem('user') || '{}'
    )

    if (!user.student_code || user.role !== 'student') {
  router.push('/login')
  return
}

    fetch(
      `/api/student?student_code=${user.student_code}`
    )
      .then((res) => res.json())
      .then((data) => {
        setStudent(data)
        setLoading(false)
      })
  }, [router])

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!student) return

    const res = await fetch(
      '/api/update-progress',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: student.group_name,
          progress: Number(progress),
        }),
      }
    )

    const data = await res.json()

    if (data.success) {
      alert('ส่งความคืบหน้าเรียบร้อยแล้ว')

      // โหลดข้อมูลใหม่
      const user = JSON.parse(
        localStorage.getItem('user') || '{}'
      )

      const updated = await fetch(
        `/api/student?student_code=${user.student_code}`
      ).then((r) => r.json())

      setStudent(updated)
      setDescription('')
      setProgress('25')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-slate-50'>
        <p>กำลังโหลดข้อมูล...</p>
      </main>
    )
  }

  if (!student) return null

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-3xl space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>
              Student Dashboard
            </h1>
            <p className='text-slate-600'>
              หน้าส่งความคืบหน้าโครงงาน
            </p>
          </div>

          <button
            onClick={handleLogout}
            className='rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700'
          >
            Logout
          </button>
        </div>

        {/* Student Info */}
        <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200'>
          <h2 className='mb-4 text-xl font-semibold text-slate-900'>
            ข้อมูลนักศึกษา
          </h2>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <p className='text-sm text-slate-500'>ชื่อ</p>
              <p className='font-medium'>{student.name}</p>
            </div>

            <div>
              <p className='text-sm text-slate-500'>
                รหัสนักศึกษา
              </p>
              <p className='font-medium'>
                {student.student_code}
              </p>
            </div>

            <div>
              <p className='text-sm text-slate-500'>กลุ่ม</p>
              <p className='font-medium'>
                {student.group_name}
              </p>
            </div>

            <div>
              <p className='text-sm text-slate-500'>
                โปรเจก
              </p>
              <p className='font-medium'>
                {student.project}
              </p>
            </div>
          </div>
        </div>

        {/* Current Progress */}
        <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200'>
          <h2 className='mb-4 text-xl font-semibold text-slate-900'>
            ความคืบหน้าปัจจุบัน
          </h2>

          <div className='space-y-3'>
            <div>
              <div className='mb-2 flex justify-between text-sm'>
                <span>ความคืบหน้า</span>
                <span className='font-semibold'>
                  {student.progress}%
                </span>
              </div>

              <div className='h-3 overflow-hidden rounded-full bg-slate-200'>
                <div
                  className='h-full rounded-full bg-blue-600'
                  style={{
                    width: `${student.progress}%`,
                  }}
                />
              </div>
            </div>

            <div className='pt-2'>
              <span className='text-sm text-slate-500'>
                สถานะ:
              </span>{' '}
              <span className='rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700'>
                {student.status}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Form */}
        <form
          onSubmit={handleSubmit}
          className='space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200'
        >
          <h2 className='text-xl font-semibold text-slate-900'>
            ส่งความคืบหน้าใหม่
          </h2>

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
                  className={`rounded-xl border px-4 py-3 font-semibold transition ${
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
              รายละเอียดงานที่ทำเสร็จ
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={5}
              required
              placeholder='อธิบายสิ่งที่ทำเสร็จแล้ว...'
              className='w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none'
            />
          </div>

          <button
            type='submit'
            className='w-full rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow hover:bg-blue-700'
          >
            ส่งความคืบหน้า
          </button>
        </form>
      </div>
    </main>
  )
}