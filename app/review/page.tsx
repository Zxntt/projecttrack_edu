'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Group = {
  id: number
  name: string
  project: string
  progress: number
  status: string
}

export default function ReviewPage() {
  const router = useRouter()

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  // ตรวจสิทธิ์อาจารย์
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    const role = String(user.role || '').trim().toLowerCase()

    if (role !== 'teacher') {
      router.push('/student')
      return
    }

    fetchGroups()
  }, [router])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups')
      const data = await res.json()

      // เอาเฉพาะที่รอตรวจ
      setGroups(
        data.filter(
          (g: Group) => g.status === 'รอตรวจ'
        )
      )
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const reviewProject = async (
    groupName: string,
    status: 'ผ่าน' | 'ต้องแก้ไข'
  ) => {
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupName,
        status,
      }),
    })

    const data = await res.json()

    if (data.success) {
      alert('อัปเดตสถานะเรียบร้อยแล้ว')
      fetchGroups()
    } else {
      alert('เกิดข้อผิดพลาด')
    }
  }

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-slate-50'>
        <p>กำลังโหลดข้อมูล...</p>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>
              ตรวจงานนักเรียน
            </h1>
            <p className='text-slate-600'>
              กลุ่มที่รอตรวจจากอาจารย์
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            className='rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            กลับ Dashboard
          </button>
        </div>

        {groups.length === 0 ? (
          <div className='rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200'>
            <p className='text-lg font-medium text-slate-700'>
              ไม่มีงานที่รอตรวจ 🎉
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200'
            >
              <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
                <div className='space-y-3'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-900'>
                      {group.name}
                    </h2>
                    <p className='text-slate-600'>
                      {group.project}
                    </p>
                  </div>

                  <div>
                    <div className='mb-2 flex justify-between text-sm text-slate-700'>
                      <span>ความคืบหน้า</span>
                      <span className='font-semibold'>
                        {group.progress}%
                      </span>
                    </div>

                    <div className='h-3 w-72 overflow-hidden rounded-full bg-slate-200'>
                      <div
                        className='h-full rounded-full bg-blue-600'
                        style={{
                          width: `${group.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className='rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700'>
                      รอตรวจ
                    </span>
                  </div>
                </div>

                <div className='flex flex-col gap-3 md:w-48'>
                  <button
                    onClick={() =>
                      reviewProject(
                        group.name,
                        'ผ่าน'
                      )
                    }
                    className='rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700'
                  >
                    อนุมัติผ่าน
                  </button>

                  <button
                    onClick={() =>
                      reviewProject(
                        group.name,
                        'ต้องแก้ไข'
                      )
                    }
                    className='rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700'
                  >
                    ส่งกลับแก้ไข
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}