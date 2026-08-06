'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success) {
        // เก็บข้อมูลผู้ใช้
        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        )

        // แยกหน้า
        if (data.user.role === 'teacher') {
          router.push('/')
        } else {
          router.push('/student')
        }
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error(error)
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-50 p-6'>
      <div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200'>
        <div className='mb-6 text-center'>
          <h1 className='text-3xl font-bold text-slate-900'>
            ProjectTrack EDU
          </h1>
          <p className='mt-2 text-slate-600'>
            เข้าสู่ระบบติดตามโครงงาน
          </p>
        </div>

        <form onSubmit={handleLogin} className='space-y-5'>
          <div>
            <label className='mb-2 block text-sm font-medium text-slate-700'>
              อีเมล
            </label>

            <input
              type='email'
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              placeholder='example@cmtc.ac.th'
              className='w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none'
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-700'>
              รหัสผ่าน
            </label>

            <input
              type='password'
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              placeholder='••••••••'
              className='w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50'
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className='mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600'>
          <p className='font-semibold'>บัญชีทดสอบ</p>

          <div className='mt-2 space-y-1'>
            <p>นักเรียน: 66001@cmtc.ac.th / 123456</p>
            <p>อาจารย์: teacher@cmtc.ac.th / admin123</p>
          </div>
        </div>
      </div>
    </main>
  )
}