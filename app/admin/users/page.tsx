'use client'

import { useEffect, useState } from 'react'

type User = {
  id: number
  student_code: string
  name: string
  email: string
  role: string
  project_name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)


  const [form, setForm] = useState({
    student_code: '',
    name: '',
    email: '',
    password: '',
    role: 'student',
    project_name: '',
  })

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (data.success) {
      alert('เพิ่มผู้ใช้สำเร็จ')
      setForm({
        student_code: '',
        name: '',
        email: '',
        password: '',
        role: 'student',
        project_name: '',
      })
      fetchUsers()
    }
  }

  // ฟังก์ชันลบผู้ใช้
  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบผู้ใช้นี้หรือไม่?'))
      return

    const res = await fetch(
      `/api/users?id=${id}`,
      {
        method: 'DELETE',
      }
    )

    const data = await res.json()

    if (data.success) {
      alert('ลบสำเร็จ')
      fetchUsers()
    } else {
      alert('ลบไม่สำเร็จ')
    }
  }

  // ฟังก์ชันเลือกแก้ไข
const handleEdit = (user: User) => {
  setEditingId(user.id)

  setForm({
    student_code: user.student_code,
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    project_name: user.project_name || '',
  })
}

// ฟังก์ชันบันทึกการแก้ไข
const handleUpdate = async (
  e: React.FormEvent
) => {
  e.preventDefault()

  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
  id: editingId,
  student_code: form.student_code,
  name: form.name,
  email: form.email,
  role: form.role,
  project_name: form.project_name,
}),
  })

  const data = await res.json()

  if (data.success) {
    alert('แก้ไขสำเร็จ')

    setEditingId(null)

    setForm({
      student_code: '',
      name: '',
      email: '',
      password: '',
      role: 'student',
      project_name: '',
    })

    fetchUsers()
  }
}

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>
            จัดการผู้ใช้
          </h1>
          <p className='text-slate-600'>
            เพิ่มนักเรียนและอาจารย์ผ่านหน้าเว็บ
          </p>
        </div>

        <form
          onSubmit={
            editingId
                ? handleUpdate
                : handleSubmit
            }
          className='grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2'
        >
          <input
            placeholder='รหัสนักศึกษา'
            value={form.student_code}
            onChange={(e) =>
              setForm({
                ...form,
                student_code: e.target.value,
              })
            }
            className='rounded-xl border px-4 py-3'
            required
          />

          <input
            placeholder='ชื่อ'
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className='rounded-xl border px-4 py-3'
            required
          />

          <input
            type='email'
            placeholder='อีเมล'
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className='rounded-xl border px-4 py-3'
            required
          />

          <input
            type='password'
            placeholder='รหัสผ่าน'
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            className='rounded-xl border px-4 py-3'
            required
          />

          <select
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
            className='rounded-xl border px-4 py-3'
          >
            <option value='student'>นักเรียน</option>
            <option value='teacher'>อาจารย์</option>
          </select>

          <input
            type='number'
            placeholder='ชื่อโปรเจก'
            value={form.project_name}
            onChange={(e) =>
              setForm({
                ...form,
                project_name: e.target.value,
              })
            }
            className='rounded-xl border px-4 py-3'
          />

          <button
            type='submit'
            className='rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 md:col-span-2'
          >
            {editingId
                ? 'บันทึกการแก้ไข'
                : 'เพิ่มผู้ใช้'}
          </button>
        </form>

        <div className='overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-100'>
              <tr>
                <th className='px-4 py-3 text-left text-sm font-semibold'>
                  รหัส
                </th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>
                  ชื่อ
                </th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>
                  อีเมล
                </th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>
                  สิทธิ์
                </th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>
                  โปรเจก
                </th>

                {/* เพิ่มหัวข้อจัดการ */}
                <th className='px-4 py-3 text-left text-sm font-semibold'>
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody className='divide-y divide-slate-100'>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className='px-4 py-3'>
                    {u.student_code}
                  </td>
                  <td className='px-4 py-3'>{u.name}</td>
                  <td className='px-4 py-3'>{u.email}</td>
                  <td className='px-4 py-3'>{u.role}</td>
                  <td className='px-4 py-3'>
                    {u.project_name || '-'}
                  </td>

                  {/* ปุ่มลบ */}
                  <td className='px-4 py-3'>
  <div className='flex gap-2'>
    <button
      onClick={() => handleEdit(u)}
      className='rounded-lg bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600'
    >
      แก้ไข
    </button>

    <button
      onClick={() => handleDelete(u.id)}
      className='rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700'
    >
      ลบ
    </button>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}