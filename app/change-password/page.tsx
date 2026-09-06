'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
        setMessage({ text: '✨ เปลี่ยนรหัสผ่านสำเร็จ! กำลังพาคุณกลับ...', type: 'success' })
        setTimeout(() => {
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
    } catch {
      setMessage({ text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-800">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            🔐 เปลี่ยนรหัสผ่าน
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            ผู้ใช้งาน: {user?.name || 'กำลังโหลด...'}
          </p>
        </div>

        {message.text && (
          <div
            className={`rounded-lg p-3 text-xs font-medium border ${
              message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">รหัสผ่านเดิม</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">รหัสผ่านใหม่</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-1/2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition"
            >
              ← กลับ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? 'กำลังบันทึก...' : '💾 บันทึกรหัสใหม่'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}