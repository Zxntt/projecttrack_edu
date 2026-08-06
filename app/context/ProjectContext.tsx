'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export type Group = {
  id: number
  name: string
  project: string
  progress: number
  status: string
}

type ProjectContextType = {
  groups: Group[]
  updateProgress: (groupName: string, progress: number) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

const initialGroups: Group[] = [
  {
    id: 1,
    name: 'กลุ่ม 1',
    project: 'Smart Doorbell',
    progress: 50,
    status: 'ผ่าน',
  },
  {
    id: 2,
    name: 'กลุ่ม 2',
    project: 'IoT Parking System',
    progress: 75,
    status: 'รอตรวจ',
  },
  {
    id: 3,
    name: 'กลุ่ม 3',
    project: 'Student Attendance App',
    progress: 25,
    status: 'ต้องแก้ไข',
  },
  {
    id: 4,
    name: 'กลุ่ม 4',
    project: 'Library Management',
    progress: 100,
    status: 'เสร็จสมบูรณ์',
  },
]

export function ProjectProvider({
  children,
}: {
  children: ReactNode
}) {
  const [groups, setGroups] = useState<Group[]>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('project-groups')
    if (saved) {
      return JSON.parse(saved)
    }
  }
  return initialGroups
})

useEffect(() => {
  localStorage.setItem('project-groups', JSON.stringify(groups))
}, [groups])

  const updateProgress = (groupName: string, progress: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.name === groupName
          ? {
              ...g,
              progress,
              status: 'รอตรวจ',
            }
          : g
      )
    )
  }

  return (
    <ProjectContext.Provider value={{ groups, updateProgress }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)

  if (!context) {
    throw new Error('useProjects must be used within ProjectProvider')
  }

  return context
}