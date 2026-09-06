'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

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
        // ปรับให้ส่ง identifier ไปตรงกับที่ API คาดหวัง
        body: JSON.stringify({
          identifier,
          password,
        }),
      })

      // ป้องกัน Error Unexpected end of JSON ด้วยการอ่านเป็น Text ก่อนแปลง
      const responseText = await res.text()
      const data = responseText ? JSON.parse(responseText) : {}

      if (!res.ok) {
        alert(data.error || data.message || 'อีเมล / รหัสนักศึกษา หรือรหัสผ่านไม่ถูกต้อง')
        return
      }

      if (data.success && data.user) {
        // ทำความสะอาดค่า role ตั้งแต่ตอนเก็บ localStorage เลย กันปัญหาตัวพิมพ์เล็ก-ใหญ่/ช่องว่างที่หลุดมาจากฐานข้อมูล
        const cleanUser = {
          ...data.user,
          role: String(data.user.role || '').trim().toLowerCase(),
        }
        localStorage.setItem('user', JSON.stringify(cleanUser))

        // แยกเส้นทางตามบทบาท (Role)
        if (cleanUser.role === 'teacher') {
          router.push('/')
        } else {
          router.push('/student')
        }
      } else {
        alert(data.error || data.message || 'อีเมล / รหัสนักศึกษา หรือรหัสผ่านไม่ถูกต้อง')
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
      className="flex min-h-screen items-center justify-center bg-[#DAEBF7] p-6 text-[#1B2431]"
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

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)]">
        {/* Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <img 
            src="/pic/1.png" 
            alt="ProjectTrack EDU Logo" 
            className="mb-4 h-20 w-20 object-contain" 
          />
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0B1F3A]">
            ProjectTrack EDU
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            เข้าสู่ระบบติดตามความก้าวหน้าโครงงาน
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              อีเมล หรือ รหัสนักศึกษา
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="เช่น 68319010015 หรือ email@cmtc.ac.th"
              className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0B1F3A] py-3 font-semibold text-white transition hover:bg-[#132A4C] disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* ปุ่มไปหน้าสมัครสมาชิก */}
        <div className="mt-6 text-center text-sm text-slate-500">
          ยังไม่มีบัญชีผู้ใช้งาน?{' '}
          <Link href="/register" className="font-semibold text-[#0B1F3A] hover:underline">
            สมัครสมาชิกที่นี่
          </Link>
        </div>
      </div>
    </main>
  )
}