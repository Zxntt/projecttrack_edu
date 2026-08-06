import './globals.css'
import { ProjectProvider } from './context/ProjectContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='th'>
      <body>
        <ProjectProvider>{children}</ProjectProvider>
      </body>
    </html>
  )
}