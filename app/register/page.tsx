'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    student_code: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    if (form.role === 'student' && !form.student_code.trim()) {
      alert('กรุณากรอกรหัสนักศึกษา')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: form.role === 'student' ? form.student_code.trim() : null,
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('✨ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ')
        router.push('/login')
      } else {
        alert(data.error || data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน')
      }
    } catch (error) {
      console.error('Register failed:', error)
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
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

      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)]">
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
            กรอกข้อมูลเพื่อสร้างบัญชีสำหรับนักศึกษาและอาจารย์
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* สถานะผู้ใช้งาน (เลือกก่อน) */}
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              สถานะผู้ใช้งาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] focus:border-[#0B1F3A]/40 focus:outline-none"
            >
              <option value="student">👨‍🎓 นักเรียน / นักศึกษา (Student)</option>
            </select>
          </div>

          {/* แสดงช่องรหัสนักศึกษาเฉพาะบทบาท student */}
          {form.role === 'student' && (
            <div>
              <label className="mb-2 block text-xs text-slate-500">
                รหัสนักศึกษา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น 68319010015"
                value={form.student_code}
                onChange={(e) => setForm({ ...form, student_code: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
                required={form.role === 'student'}
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              ชื่อ - นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น นายธนกฤต กุณะแสงคำ"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              อีเมล <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder={form.role === 'student' ? 'student@cmtc.ac.th' : 'teacher@cmtc.ac.th'}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-slate-500">
                รหัสผ่าน <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-slate-500">
                ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-[#0B1F3A] py-3.5 font-semibold text-white transition hover:bg-[#132A4C] disabled:opacity-50"
          >
            {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเข้าใช้งาน'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
          <Link href="/login" className="font-semibold text-[#0B1F3A] hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </main>
  )
}