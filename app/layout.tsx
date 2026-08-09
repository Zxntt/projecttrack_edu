import './globals.css'
import { ProjectProvider } from './context/ProjectContext'
import Navbar from './navbar/Navbar'
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
    <html lang='th'>
      <body>
        <ProjectProvider>
          <Navbar />
          {children}
        </ProjectProvider>
      </body>
    </html>
  )
}