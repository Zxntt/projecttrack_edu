'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.replace('/login')
      return
    }
    setUser(JSON.parse(userStr))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ text: '', type: '' })

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', type: 'error' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          oldPassword,
          newPassword,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ text: 'เปลี่ยนรหัสผ่านสำเร็จ! กำลังพาคุณกลับ...', type: 'success' })
        setTimeout(() => {
          // เด้งกลับไปหน้าตามสิทธิ์ role
          const role = String(user.role || '').trim().toLowerCase()
          if (role === 'teacher') {
            router.push('/approvals')
          } else {
            router.push('/student')
          }
        }, 1500)
      } else {
        setMessage({ text: data.error || 'เกิดข้อผิดพลาด', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    const role = String(user?.role || '').trim().toLowerCase()
    if (role === 'teacher') {
      router.push('/approvals')
    } else {
      router.push('/student')
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#05070d] p-6 text-slate-200"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(246, 247, 248, 0.94) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl space-y-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            🔐 เปลี่ยนรหัสผ่าน
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            ผู้ใช้งาน: {user?.name || 'Loading...'}
          </p>
        </div>

        {message.text && (
          <div
            className={`rounded-xl p-3 text-xs font-mono border ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-mono text-slate-400">รหัสผ่านเดิม</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-mono text-slate-400">รหัสผ่านใหม่</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-mono text-slate-400">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="w-1/2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              ← กลับ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : '💾 บันทึกรหัสใหม่'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}