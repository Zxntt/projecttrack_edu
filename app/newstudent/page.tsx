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
  created_by?: string | number;
  members: Member[];
}

export default function NewStudentPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // User State
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (!user.role) {
        router.replace("/login");
        return;
      }
      user.role = String(user.role).trim().toLowerCase();
      setCurrentUser(user);
      fetchGroups();
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/login");
    }
  }, [router]);

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
    if (currentUser && currentUser.role !== "teacher") {
      const myCode = currentUser.student_code || currentUser.studentId || "";
      const myName = currentUser.name || currentUser.fullname || "";
      if (myCode && myName) {
        setMembers([{ studentId: myCode, fullname: myName }]);
      }
    }
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

  const handleGoBack = () => {
    if (currentUser?.role === "teacher") {
      router.push("/");
    } else {
      router.push("/student");
    }
  };

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

    if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบก่อนดำเนินการสร้างกลุ่ม");
      router.replace("/login");
      return;
    }

    const createdBy = currentUser.id || currentUser.student_code || currentUser.studentId;

    const payload = {
      className,
      groupName: groupName.trim(),
      projectName: projectName.trim(),
      members,
      createdBy,
      requesterStudentId: createdBy,
      requesterRole: currentUser.role,
    };

    try {
      if (editingId !== null) {
        const res = await fetch(`/api/groups/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || data.message || "ไม่สามารถแก้ไขกลุ่มได้");
          return;
        }

        if (currentUser.role !== "teacher") {
          const updatedUser = {
            ...currentUser,
            group_name: groupName.trim(),
            project: projectName.trim(),
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        alert("✨ แก้ไขข้อมูลกลุ่มเรียบร้อยแล้ว");
      } else {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || data.message || "ไม่สามารถสร้างกลุ่มได้");
          return;
        }

        if (currentUser.role !== "teacher") {
          const newGroupId = data.groupId || data.id;
          const updatedUser = {
            ...currentUser,
            group_id: newGroupId,
            group_name: groupName.trim(),
            project: projectName.trim(),
            status: "pending",
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        alert("✨ บันทึกข้อมูลกลุ่มเรียบร้อยแล้ว!");
      }

      handleCloseModal();
      handleGoBack();
    } catch (error) {
      console.error("Error saving group:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  const handleDeleteGroup = async (id?: number) => {
    if (!id) return;
    if (confirm("คุณต้องการลบกลุ่มนี้ใช่หรือไม่? ข้อมูลสมาชิกจะถูกลบออกไปด้วย")) {
      try {
        const studentCodeParam = currentUser?.id || currentUser?.student_code || currentUser?.studentId || "";
        const roleParam = currentUser?.role || "student";

        const res = await fetch(
          `/api/groups/${id}?studentId=${studentCodeParam}&role=${roleParam}`,
          { method: "DELETE" }
        );

        if (res.ok) {
          alert("ลบกลุ่มเรียบร้อยแล้ว");
          fetchGroups();
        } else {
          const data = await res.json();
          alert(data.error || "เกิดข้อผิดพลาดในการลบกลุ่ม");
        }
      } catch (error) {
        console.error("Error deleting group:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const isGroupOwner = (group: Group) => {
    if (!currentUser) return false;
    if (currentUser.role === "teacher") return true;

    const myId = String(currentUser.id || "").trim();
    const myCode = String(currentUser.student_code || currentUser.studentId || "").trim();
    const ownerId = String(group.created_by || "").trim();

    const isCreator = ownerId === myId || ownerId === myCode;
    const isMember = group.members?.some(
      (m) => String(m.studentId).trim() === myCode
    );

    return isCreator || isMember;
  };

  return (
    <main
      className="min-h-screen p-6 text-[#1B2431]"
      style={{
        backgroundColor: "#DAEBF7",
        fontFamily: "'Noto Sans Thai', 'IBM Plex Sans Thai', system-ui, sans-serif",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, #0b1f3a12 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
        .font-display {
          font-family: 'Noto Serif Thai', serif;
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Card */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0B1F3A]">
              📋 จัดการกลุ่มนักเรียน
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              เพิ่ม แก้ไข และลบกลุ่มนักเรียนพร้อมรายชื่อผู้จัดทำโครงงาน
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGoBack}
              className="rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-2.5 text-sm font-medium text-[#0B1F3A] transition hover:bg-slate-100"
            >
              ⬅️ {currentUser?.role === "teacher" ? "กลับหน้าหลัก" : "กลับหน้าส่งงาน"}
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#132A4C]"
            >
              + เพิ่มกลุ่มใหม่
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex h-48 items-center justify-center font-mono text-sm text-[#0B1F3A]/60">
            LOADING DATA...
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)]">
            <p className="font-mono text-slate-400">ยังไม่มีกลุ่มนักเรียนในระบบ</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 rounded-xl border border-slate-200 bg-[#F7F8FB] px-5 py-2.5 text-sm font-medium text-[#0B1F3A] hover:bg-slate-100 transition"
            >
              + คลิกที่นี่เพื่อเริ่มเพิ่มกลุ่มแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groups.map((group) => {
              const canEdit = isGroupOwner(group);

              return (
                <div
                  key={group.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.08)] transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                        {group.groupName}
                      </h3>
                      <span className="rounded-full border border-slate-200 bg-[#F7F8FB] px-3 py-1 text-xs font-mono text-[#0B1F3A]">
                        {group.className}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-semibold text-[#0B1F3A]">โครงงาน :</span>{" "}
                      {group.projectName}
                    </p>

                    <div className="mt-4 rounded-xl border border-slate-100 bg-[#F7F8FB] p-4">
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        สมาชิก ({group.members ? group.members.length : 0} คน)
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-[#1B2431]">
                        {group.members && group.members.length > 0 ? (
                          group.members.map((m, i) => (
                            <li key={i} className="flex justify-between items-center">
                              <span>{m.fullname}</span>
                              <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {m.studentId}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="font-mono text-xs text-slate-400">
                            ไม่มีสมาชิก
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                    {canEdit ? (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(group)}
                          className="flex-1 rounded-xl border border-amber-200 bg-amber-50 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition"
                        >
                          ✏️ แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition"
                        >
                          🗑️ ลบ
                        </button>
                      </>
                    ) : (
                      <span className="w-full text-center text-xs font-mono text-slate-400 py-1">
                        🔒 ดูได้อย่างเดียว (ไม่ใช่เจ้าของกลุ่ม)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-xl font-bold text-[#0B1F3A]">
                {editingId !== null ? "✏️ แก้ไขกลุ่มนักเรียน" : "✨ เพิ่มกลุ่มนักเรียน"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  ห้องเรียน
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] p-3 text-[#0B1F3A] focus:border-[#0B1F3A]/40 focus:outline-none transition"
                >
                  <option>ปวส.2 สายตรง</option>
                  <option>ปวส.2 ม.6</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  ชื่อกลุ่ม
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="เช่น กลุ่มที่ 1"
                  className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] p-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  หัวข้อโครงงาน
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="เช่น ระบบติดตามโครงงาน"
                  className="w-full rounded-xl border border-slate-200 bg-[#F7F8FB] p-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none transition"
                />
              </div>

              <hr className="my-4 border-slate-100" />

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  เพิ่มสมาชิกในกลุ่ม
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="รหัสนักศึกษา"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-[#F7F8FB] p-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-[#F7F8FB] p-3 text-[#0B1F3A] placeholder-slate-400 focus:border-[#0B1F3A]/40 focus:outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="mt-3 rounded-xl border border-slate-200 bg-[#F7F8FB] px-4 py-2 text-sm font-medium text-[#0B1F3A] hover:bg-slate-100 transition"
                >
                  + เพิ่มสมาชิก
                </button>
              </div>

              <div>
                <p className="mb-2 text-xs font-mono text-slate-500">
                  รายชื่อสมาชิกที่เลือกไว้ ({members.length} คน):
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F7F8FB] p-2.5 text-sm text-[#1B2431]"
                    >
                      <span>
                        <span className="font-mono text-slate-500">
                          {member.studentId}
                        </span>{" "}
                        - {member.fullname}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="text-xs text-rose-600 hover:text-rose-700 transition"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveGroup}
                className="rounded-xl bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#132A4C] transition"
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