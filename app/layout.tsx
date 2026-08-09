import './globals.css'
import { ProjectProvider } from './context/ProjectContext'
import Navbar from './navbar/Navbar'

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