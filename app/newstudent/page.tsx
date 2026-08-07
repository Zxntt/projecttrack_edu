"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Member {
  studentId: string;
  fullname: string;
}

interface Group {
  id?: number;
  className: string;
  groupName: string;
  projectName: string;
  members: Member[];
}

export default function NewStudentPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form States
  const [className, setClassName] = useState("ปวส.2 สายตรง");
  const [groupName, setGroupName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  // Main Data State
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลกลุ่มทั้งหมดจาก MySQL เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClassName("ปวส.2 สายตรง");
    setGroupName("");
    setProjectName("");
    setStudentId("");
    setStudentName("");
    setMembers([]);
    setEditingId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setOpen(true);
  };

  const handleOpenEditModal = (group: Group) => {
    if (!group.id) return;
    setClassName(group.className || "ปวส.2 สายตรง");
    setGroupName(group.groupName);
    setProjectName(group.projectName);
    setMembers(group.members ? [...group.members] : []);
    setEditingId(group.id);
    setOpen(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpen(false);
  };

  const handleAddMember = () => {
    if (!studentId.trim() || !studentName.trim()) {
      alert("กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุล");
      return;
    }

    setMembers([
      ...members,
      { studentId: studentId.trim(), fullname: studentName.trim() },
    ]);
    setStudentId("");
    setStudentName("");
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  // บันทึกข้อมูลลง MySQL ผ่าน API
  const handleSaveGroup = async () => {
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

    const payload = {
      className,
      groupName: groupName.trim(),
      projectName: projectName.trim(),
      members,
    };

    try {
      if (editingId !== null) {
        // แก้ไขกลุ่มเดิมใน MySQL
        await fetch(`/api/groups/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // เพิ่มกลุ่มใหม่ลง MySQL
        await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      fetchGroups(); // รีโหลดข้อมูลล่าสุดจาก DB
      handleCloseModal();
    } catch (error) {
      console.error("Error saving group:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // ลบกลุ่มออกจาก MySQL
  const handleDeleteGroup = async (id?: number) => {
    if (!id) return;
    if (confirm("คุณต้องการลบกลุ่มนี้ใช่หรือไม่? ข้อมูลสมาชิกจะถูกลบออกไปด้วย")) {
      try {
        await fetch(`/api/groups/${id}`, { method: "DELETE" });
        fetchGroups();
      } catch (error) {
        console.error("Error deleting group:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  return (
    <main
      className="min-h-screen bg-[#05070d] p-6 text-slate-200"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              📋 จัดการกลุ่มนักเรียน
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              ( เพิ่ม แก้ไข และลบกลุ่มนักเรียนพร้อมรายชื่อผู้จัดทำ ) 
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/40 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-800"
            >
              ⬅️ กลับหน้าหลัก
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-2 font-medium text-emerald-300 shadow-[0_0_20px_-6px_rgba(52,211,153,0.5)] transition hover:bg-emerald-400/20"
            >
              + เพิ่มกลุ่มใหม่
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex h-64 items-center justify-center font-mono text-sm text-cyan-400/70">
            LOADING DATA · กำลังโหลดข้อมูล...
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
            <p className="font-mono text-slate-500">ยังไม่มีกลุ่มนักเรียนในระบบ</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-400/20"
            >
              + คลิกที่นี่เพื่อเริ่มเพิ่มกลุ่มแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100">
                      {group.groupName}
                    </h3>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-mono text-cyan-300">
                      {group.className}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    <span className="font-semibold text-slate-300">โครงงาน :</span>{" "}
                    {group.projectName}
                  </p>

                  <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
                      สมาชิก ({group.members ? group.members.length : 0} คน)
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {group.members && group.members.length > 0 ? (
                        group.members.map((m, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{m.fullname}</span>
                            <span className="font-mono text-xs text-slate-500">
                              {m.studentId}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="font-mono text-xs text-slate-600">
                          ไม่มีสมาชิก
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 border-t border-slate-800/60 pt-4">
                  <button
                    onClick={() => handleOpenEditModal(group)}
                    className="flex-1 rounded-xl border border-amber-400/30 bg-amber-400/10 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/20"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="flex-1 rounded-xl border border-rose-400/30 bg-rose-400/10 py-2 text-sm font-medium text-rose-300 hover:bg-rose-400/20"
                  >
                    🗑️ ลบกลุ่ม
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0b0f19] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100">
                {editingId !== null ? "✏️ แก้ไขกลุ่มนักเรียน" : "✨ เพิ่มกลุ่มนักเรียน"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  ห้องเรียน
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option>ปวส.2 สายตรง</option>
                  <option>ปวส.2 ม.6</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  ชื่อกลุ่ม
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="เช่น กลุ่มที่ 1"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  หัวข้อโครงงาน
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="เช่น ระบบติดตามโครงงาน"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <hr className="my-4 border-slate-800" />

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-300">
                  เพิ่มสมาชิกในกลุ่ม
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="รหัสนักศึกษา"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-400/20"
                >
                  + เพิ่มสมาชิก
                </button>
              </div>

              <div>
                <p className="mb-2 text-xs font-mono text-slate-400">
                  รายชื่อสมาชิกที่เลือกไว้ ({members.length} คน):
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 text-sm"
                    >
                      <span>
                        <span className="font-mono text-cyan-400">
                          {member.studentId}
                        </span>{" "}
                        - {member.fullname}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveGroup}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
              >
                {editingId !== null ? "บันทึกการแก้ไข" : "บันทึกกลุ่ม"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}