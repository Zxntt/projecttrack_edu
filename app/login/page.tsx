'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  // เปลี่ยนชื่อ state ให้ชัดเจนขึ้นว่ารับได้ทั้ง email หรือ student_code
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // ส่งค่า identifier ไปเป็น email หรือ student_code
        body: JSON.stringify({
          email: identifier,
          student_code: identifier,
          password,
        }),
      })

      const data = await res.json()

      if (data.success && data.user) {
        // บันทึกข้อมูลผู้ใช้ลง localStorage
        localStorage.setItem('user', JSON.stringify(data.user))

        // แยกเส้นทางตามบทบาท (Role)
        if (data.user.role === 'teacher') {
          router.push('/')
        } else {
          router.push('/student')
        }
      } else {
        alert(data.message || 'อีเมล / รหัสนักศึกษา หรือรหัสผ่านไม่ถูกต้อง')
      }
    } catch (error) {
      console.error(error)
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#05070d] p-6 text-slate-200"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            🚀 ProjectTrack EDU
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            เข้าสู่ระบบติดตามความก้าวหน้าโครงงาน
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-mono text-slate-400">
              อีเมล หรือ รหัสนักศึกษา
            </label>
            <input
              type="text" // เปลี่ยนเป็น text เพื่อรับได้ทั้งข้อความและตัวเลขรหัสนักศึกษา
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="เช่น 68319010015 หรือ email@cmtc.ac.th"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-mono text-slate-400">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-3 font-semibold text-cyan-300 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)] transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* ปุ่มไปหน้าสมัครสมาชิก */}
        <div className="mt-6 text-center text-sm text-slate-400">
          ยังไม่มีบัญชีผู้ใช้งาน?{' '}
          <Link href="/register" className="font-semibold text-cyan-400 hover:underline">
            สมัครสมาชิกที่นี่
          </Link>
        </div>

        {/* บัญชีทดสอบ */}
        <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs font-mono text-slate-400">
          <p className="font-semibold text-slate-300">💡 บัญชีทดสอบระบบ:</p>
          <div className="mt-2 space-y-1 text-slate-400">
            <p>นักเรียน: 68319010015 / 123456</p>
            <p>อาจารย์: teacher@cmtc.ac.th / admin123</p>
          </div>
        </div>
      </div>
    </main>
  )
}