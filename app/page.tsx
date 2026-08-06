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

function statusColor(status: string) {
  switch (status) {
    case 'ผ่าน':
    case 'เสร็จสมบูรณ์':
      return 'bg-green-100 text-green-700'
    case 'รอตรวจ':
      return 'bg-yellow-100 text-yellow-700'
    case 'ต้องแก้ไข':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

useEffect(() => {
  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  )

  if (user.role !== 'teacher') {
    router.push('/login')
  }
}, [router])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups')
      const data = await res.json()
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
  }, [])

  const average =
    groups.length > 0
      ? groups.reduce((sum, g) => sum + g.progress, 0) /
        groups.length
      : 0

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-slate-50'>
        <p className='text-lg text-slate-600'>กำลังโหลดข้อมูล...</p>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>
              ProjectTrack EDU
            </h1>
            <p className='text-slate-600'>
              ระบบติดตามความก้าวหน้าโครงงานนักเรียน
            </p>
          </div>

         <div className='flex gap-2'>
  <button
    onClick={fetchGroups}
    className='rounded-xl bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-700'
  >
    รีเฟรชข้อมูล
  </button>

  <button
    onClick={() => router.push('/review')}
    className='rounded-xl bg-yellow-500 px-4 py-2 font-medium text-white shadow hover:bg-yellow-600'
  >
    ตรวจงาน
  </button>

  <button
    onClick={handleLogout}
    className='rounded-xl bg-red-600 px-4 py-2 font-medium text-white shadow hover:bg-red-700'
  >
    Logout
  </button>
</div>
        </div>

        <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <div className='rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'>
            <p className='text-sm text-slate-500'>จำนวนกลุ่มทั้งหมด</p>
            <p className='mt-2 text-3xl font-bold text-slate-900'>
              {groups.length}
            </p>
            <p className='mt-1 text-sm text-slate-500'>กลุ่ม</p>
          </div>

          <div className='rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'>
            <p className='text-sm text-slate-500'>ส่งแล้ว</p>
            <p className='mt-2 text-3xl font-bold text-green-600'>
              {groups.filter((g) => g.progress > 0).length}
            </p>
            <p className='mt-1 text-sm text-slate-500'>กลุ่ม</p>
          </div>

          <div className='rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'>
            <p className='text-sm text-slate-500'>รอตรวจ</p>
            <p className='mt-2 text-3xl font-bold text-yellow-600'>
              {groups.filter((g) => g.status === 'รอตรวจ').length}
            </p>
            <p className='mt-1 text-sm text-slate-500'>กลุ่ม</p>
          </div>

          <div className='rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'>
            <p className='text-sm text-slate-500'>เฉลี่ยทั้งห้อง</p>
            <p className='mt-2 text-3xl font-bold text-blue-600'>
              {Math.round(average)}%
            </p>
            <p className='mt-1 text-sm text-slate-500'>ความคืบหน้า</p>
          </div>
        </section>

        <section className='rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-slate-900'>
              ความก้าวหน้าของแต่ละกลุ่ม
            </h2>
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-slate-200'>
              <thead className='bg-slate-100'>
                <tr>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-slate-700'>
                    กลุ่ม
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-slate-700'>
                    หัวข้อโปรเจก
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-slate-700'>
                    ความคืบหน้า
                  </th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-slate-700'>
                    สถานะ
                  </th>
                </tr>
              </thead>

              <tbody className='divide-y divide-slate-100 bg-white'>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className='px-4 py-4 font-medium text-slate-900'>
                      {group.name}
                    </td>

                    <td className='px-4 py-4 text-slate-700'>
                      {group.project}
                    </td>

                    <td className='px-4 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='h-2 w-40 overflow-hidden rounded-full bg-slate-200'>
                          <div
                            className='h-full rounded-full bg-blue-600'
                            style={{ width: `${group.progress}%` }}
                          />
                        </div>
                        <span className='text-sm font-semibold text-slate-700'>
                          {group.progress}%
                        </span>
                      </div>
                    </td>

                    <td className='px-4 py-4'>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
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