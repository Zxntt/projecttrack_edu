import './globals.css'
import { ProjectProvider } from './context/ProjectContext'
import Navbar from './navbar/Navbar'
import Footer from './footer/footer'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Project Track',
  description: 'ระบบติดตามและจัดการโปรเจกต์',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col bg-[#05070d] text-slate-100">

        <ProjectProvider>
          {/* Navbar */}
          <Navbar />

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </ProjectProvider>

      </body>
    </html>
  )
}