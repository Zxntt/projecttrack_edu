'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  // 🟢 ระบบแจ้งเตือน (เฉพาะฝั่งนักเรียน)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  const fetchNotifications = async (studentCode: string) => {
    try {
      const res = await fetch(`/api/notifications?student_code=${encodeURIComponent(studentCode)}`)
      const data = await res.json().catch(() => null)
      if (data?.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Fetch notifications error:', error)
    }
  }

  const handleOpenNotif = () => {
    setNotifOpen((prev) => !prev)
  }

  const markNotifRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch (error) {
      console.error('Mark notification read error:', error)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const parsed = JSON.parse(userStr)
      if (parsed?.role) {
        parsed.role = String(parsed.role).trim().toLowerCase()
      }
      setUser(parsed)

      // 🟢 โหลดแจ้งเตือนใหม่ทุกครั้งที่เปลี่ยนหน้า (นักเรียนเท่านั้น)
      const code = parsed?.student_code || parsed?.studentCode
      if (parsed?.role === 'student' && code) {
        fetchNotifications(code)
      }
    }
  }, [pathname])

  // ปิดเมนมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setIsOpen(false)
    router.push('/login')
  }

  // ไม่แสดง Navbar ในหน้า Login และ Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05070d]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            🚀 ProjectTrack
          </span>
          {user?.role && (
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300">
              {user.role === 'teacher' ? 'TEACHER' : 'STUDENT'}
            </span>
          )}
        </Link>

        {/* Desktop Navigation Links (แสดงเฉพาะจอคอมพิวเตอร์) */}
        <nav className="hidden md:flex items-center gap-2 sm:gap-4">
          {user?.role === 'student' && (
            <>
              <Link
                href="/student"
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  pathname === '/student'
                    ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 Dashboard
              </Link>
              <Link
                href="/newstudent"
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  pathname === '/newstudent'
                    ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📋 จัดการกลุ่ม
              </Link>
            </>
          )}

          {user?.role === 'teacher' && (
            <>
              <Link
                href="/admin/users"
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  pathname === '/admin/users'
                    ? 'bg-violet-400/10 text-violet-300 border border-violet-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👥 จัดการผู้ใช้
              </Link>
              <Link
                href="/admin/milestones"
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  pathname === '/admin/milestones'
                    ? 'bg-violet-400/10 text-violet-300 border border-violet-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🧭 กำหนดเวลาส่งงาน
              </Link>
            </>
          )}

          {/* 🔔 กระดิ่งแจ้งเตือน (เฉพาะนักเรียน) */}
          {user?.role === 'student' && (
            <div className="relative">
              <button
                onClick={handleOpenNotif}
                className="relative rounded-xl border border-slate-700 bg-slate-800/60 p-2 text-slate-300 hover:text-white"
                aria-label="แจ้งเตือน"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-800 bg-[#0b0f19] p-2 shadow-2xl">
                  {notifications.length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-500 font-mono">
                      ยังไม่มีการแจ้งเตือน
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => !n.is_read && markNotifRead(n.id)}
                        className={`mb-1 block w-full rounded-lg p-2.5 text-left text-xs transition ${
                          n.is_read
                            ? 'bg-slate-900/40 text-slate-500'
                            : 'bg-cyan-400/10 text-slate-200 hover:bg-cyan-400/20'
                        }`}
                      >
                        <p>{n.message}</p>
                        {n.created_at && (
                          <p className="mt-1 font-mono text-[10px] text-slate-500">
                            {new Date(n.created_at).toLocaleString('th-TH')}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Profile & Logout */}
          {user ? (
            <div className="flex items-center gap-3 border-l border-slate-800 pl-3">
              <span className="hidden text-xs text-slate-300 sm:inline font-mono">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
              >
                🚪 ออกจากระบบ
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/20"
            >
              🔑 เข้าสู่ระบบ
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Button (แสดงเฉพาะจอมือถือ) */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu (แผงเมนูดรอปดาวน์สำหรับมือถือตอนกดปุ่ม) */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#05070d]/95 px-4 pt-3 pb-5 space-y-3 backdrop-blur-md">
          {user && (
            <div className="text-xs text-slate-300 font-mono pb-2 border-b border-slate-800">
              ผู้ใช้งาน: <span className="text-cyan-300">{user.name}</span>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            {user?.role === 'student' && (
              <>
                <Link
                  href="/student"
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                    pathname === '/student'
                      ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Dashboard
                </Link>
                <Link
                  href="/newstudent"
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                    pathname === '/newstudent'
                      ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📋 จัดการกลุ่ม
                </Link>
              </>
            )}

            {user?.role === 'teacher' && (
              <>
                <Link
                  href="/approvals"
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                    pathname === '/approvals'
                      ? 'bg-violet-400/10 text-violet-300 border border-violet-400/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✅ อนุมัติ
                </Link>
                <Link
                  href="/admin/users"
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                    pathname === '/admin/users'
                      ? 'bg-violet-400/10 text-violet-300 border border-violet-400/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  👥 จัดการผู้ใช้
                </Link>
                <Link
                  href="/admin/milestones"
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                    pathname === '/admin/milestones'
                      ? 'bg-violet-400/10 text-violet-300 border border-violet-400/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🧭 ไมล์สโตน
                </Link>
              </>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="w-full text-left rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
              >
                🚪 ออกจากระบบ
              </button>
            ) : (
              <Link
                href="/login"
                className="block text-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/20"
              >
                🔑 เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}