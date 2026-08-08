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
      className="flex min-h-screen items-center justify-center bg-[#05070d] p-6 text-slate-200"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            📝 สมัครสมาชิกเข้าใช้งาน
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            กรอกข้อมูลเพื่อสร้างบัญชีสำหรับนักศึกษาและอาจารย์
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* สถานะผู้ใช้งาน (เลือกก่อน) */}
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-400">
              สถานะผู้ใช้งาน <span className="text-rose-400">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="student">👨‍🎓 นักเรียน / นักศึกษา (Student)</option>
            </select>
          </div>

          {/* แสดงช่องรหัสนักศึกษาเฉพาะบทบาท student */}
          {form.role === 'student' && (
            <div>
              <label className="mb-1 block text-xs font-mono text-slate-400">
                รหัสนักศึกษา <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น 68319010015"
                value={form.student_code}
                onChange={(e) => setForm({ ...form, student_code: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none font-mono"
                required={form.role === 'student'}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-mono text-slate-400">
              ชื่อ - นามสกุล <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น นายธนกฤต กุณะแสงคำ"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-mono text-slate-400">
              อีเมล <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              placeholder={form.role === 'student' ? 'student@cmtc.ac.th' : 'teacher@cmtc.ac.th'}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-mono text-slate-400">
                รหัสผ่าน <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-mono text-slate-400">
                ยืนยันรหัสผ่าน <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-3.5 font-semibold text-cyan-300 transition hover:bg-cyan-400/20 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)] disabled:opacity-50"
          >
            {loading ? 'กำลังลงทะเบียน...' : '✨ ลงทะเบียนเข้าใช้งาน'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
          <Link href="/login" className="font-medium text-cyan-400 hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </main>
  )
}