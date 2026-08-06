"use client";

import { useState } from "react";

export default function GroupsPage() {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [className, setClassName] = useState("ปวส.2 สายตรง");

  const [groups, setGroups] = useState<
    {
      className: string;
      groupName: string;
      projectName: string;
      members: {
        studentId: string;
        fullname: string;
      }[];
    }[]
  >([]);

  const [members, setMembers] = useState<
    {
      studentId: string;
      fullname: string;
    }[]
  >([]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800">
          จัดการกลุ่มนักเรียน
        </h1>

        <p className="mt-2 text-gray-500">
          เพิ่ม แก้ไข และลบกลุ่มนักเรียน
        </p>

        {/* Card */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">รายชื่อกลุ่ม</h2>

            <button
              onClick={() => setOpen(true)}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              + เพิ่มกลุ่ม
            </button>
          </div>

          {/* ตัวอย่างข้อมูล */}
          {groups.length === 0 ? (
            <p className="mt-6 text-center text-gray-500">
              ยังไม่มีกลุ่ม
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {groups.map((group, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-5 shadow-sm"
                >
                  <h3 className="text-lg font-bold">
                    {group.groupName}
                  </h3>

                  <p className="text-gray-500">
                    โครงงาน : {group.projectName}
                  </p>

                  <p className="mt-3 font-semibold">
                    สมาชิก
                  </p>

                  <ul className="list-disc pl-6">
                    {group.members.map((member, i) => (
                      <li key={i}>
                        {member.studentId} {member.fullname}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex gap-3">
                    <button className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600">
                      แก้ไข
                    </button>

                    <button
                      onClick={() =>
                        setGroups(groups.filter((_, i) => i !== index))
                      }
                      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-lg">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                เพิ่มกลุ่มนักเรียน
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-2xl"
              >
                ✕
              </button>
            </div>

            {/* ห้องเรียน */}
            <div className="mb-4">
              <label className="mb-2 block font-medium">
                ห้องเรียน
              </label>

              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full rounded-lg border p-3"
              >
                <option>ปวส.2 สายตรง</option>
              </select>
            </div>

            {/* ชื่อกลุ่ม */}
            <div className="mb-4">
              <label className="mb-2 block font-medium">
                ชื่อกลุ่ม
              </label>

              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="กลุ่มที่ 1"
                className="w-full rounded-lg border p-3"
              />
            </div>

            {/* หัวข้อโครงงาน */}
            <div className="mb-6">
              <label className="mb-2 block font-medium">
                หัวข้อโครงงาน
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="ระบบติดตามโครงงาน"
                className="w-full rounded-lg border p-3"
              />
            </div>

            <hr className="my-6" />

            {/* สมาชิก */}
            <h3 className="mb-4 text-xl font-semibold">
              สมาชิก
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="รหัสนักศึกษา"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="rounded-lg border p-3"
              />

              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="rounded-lg border p-3"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!studentId.trim() || !studentName.trim()) {
                  alert("กรุณากรอกรหัสนักศึกษาและชื่อ");
                  return;
                }

                setMembers([
                  ...members,
                  {
                    studentId,
                    fullname: studentName,
                  },
                ]);

                setStudentId("");
                setStudentName("");
              }}
              className="mt-4 rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
            >
              + เพิ่มสมาชิก
            </button>

            {/* รายชื่อสมาชิก */}
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold">
                สมาชิกทั้งหมด
              </h3>

              {members.length === 0 ? (
                <p className="text-gray-500">
                  ยังไม่มีสมาชิก
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {member.studentId}
                        </p>

                        <p className="text-gray-500">
                          {member.fullname}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setMembers(
                            members.filter((_, i) => i !== index)
                          )
                        }
                        className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ปุ่ม */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border px-5 py-2"
              >
                ยกเลิก
              </button>

              <button
                onClick={() => {
                  if (!groupName.trim()) {
                    alert("กรุณากรอกชื่อกลุ่ม");
                    return;
                  }

                  if (!projectName.trim()) {
                    alert("กรุณากรอกหัวข้อโครงงาน");
                    return;
                  }

                  if (members.length === 0) {
                    alert("กรุณาเพิ่มสมาชิกอย่างน้อย 1 คน");
                    return;
                  }

                  setGroups([
                    ...groups,
                    {
                      className,
                      groupName,
                      projectName,
                      members,
                    },
                  ]);

                  setGroupName("");
                  setProjectName("");
                  setMembers([]);
                  setOpen(false);
                }}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}