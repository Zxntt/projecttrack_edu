import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: ดึงข้อมูลกลุ่มทั้งหมด + รายชื่อสมาชิกของแต่ละกลุ่ม
export async function GET() {
  try {
    // 1. ดึงข้อมูลจากตาราง groups
    const [groups]: any = await db.query(
      "SELECT * FROM `groups` ORDER BY id DESC"
    );

    // 2. ดึงสมาชิกของแต่ละกลุ่ม
    for (const group of groups) {
      const [members]: any = await db.query(
        `
        SELECT
          student_id AS studentId,
          fullname
        FROM group_members
        WHERE group_id = ?
        `,
        [group.id]
      );

      group.members = members;

      // แปลงชื่อคอลัมน์ให้ตรงกับหน้า UI
      group.className = group.class_name || "";
      group.groupName = group.name || group.group_name || "";
      group.projectName = group.project || group.project_name || "";
    }

    return NextResponse.json(groups);
  } catch (error) {
    console.error("GET /api/groups error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch groups",
      },
      {
        status: 500,
      }
    );
  }
}

// POST: บันทึกกลุ่มใหม่ + บันทึกสมาชิก + อัปเดต users
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      className,
      groupName,
      projectName,
      members,
      createdBy,
    } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!className || !groupName || !projectName) {
      return NextResponse.json(
        {
          error: "กรุณากรอกข้อมูลกลุ่มให้ครบถ้วน",
        },
        {
          status: 400,
        }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        {
          error: "กรุณาเพิ่มสมาชิกอย่างน้อย 1 คน",
        },
        {
          status: 400,
        }
      );
    }

    // ตรวจสอบ createdBy
    if (!createdBy) {
      return NextResponse.json(
        {
          error: "ไม่พบข้อมูลผู้สร้างกลุ่ม (กรุณาเข้าสู่ระบบใหม่)",
        },
        {
          status: 400,
        }
      );
    }

    // 1. บันทึกลงตาราง groups (กำหนด status เป็น 'pending' ชัดเจน)
    const [result]: any = await db.query(
      `
      INSERT INTO \`groups\`
      (
        class_name,
        name,
        project,
        progress,
        status,
        created_by
      )
      VALUES (?, ?, ?, 0, ?, ?)
      `,
      [
        className,
        groupName,
        projectName,
        "pending", // 🟢 เปลี่ยนจาก "รอตรวจ" เป็น "pending" เพื่อให้อาจารย์เห็นในแท็บรออนุมัติ
        createdBy,
      ]
    );

    // ID ของกลุ่มที่เพิ่งสร้าง
    const newGroupId = result.insertId;

    // 2. บันทึกรายชื่อสมาชิกลง group_members และอัปเดต group_id ในตาราง users
    for (const member of members) {
      const studentId = member.studentId || member.student_code;
      const fullname = member.fullname || member.name;

      // 2.1 เพิ่มเข้าตาราง group_members
      await db.query(
        `
        INSERT INTO group_members
        (
          group_id,
          student_id,
          fullname
        )
        VALUES (?, ?, ?)
        `,
        [
          newGroupId,
          studentId,
          fullname,
        ]
      );

      // 2.2 อัปเดต group_id ในตาราง users ให้สมาชิกทุกคน
      if (studentId) {
        await db.query(
          `UPDATE users SET group_id = ? WHERE student_code = ?`,
          [newGroupId, studentId]
        );
      }
    }

    // 3. อัปเดต group_id ให้กับผู้สร้างกลุ่ม (createdBy) ในตาราง users
    await db.query(
      `UPDATE users SET group_id = ? WHERE id = ? OR student_code = ?`,
      [newGroupId, createdBy, createdBy]
    );

    // 4. ส่งผลลัพธ์กลับไปให้หน้าเว็บ
    return NextResponse.json(
      {
        success: true,
        message: "สร้างกลุ่มสำเร็จ",
        id: newGroupId,
        groupId: newGroupId,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error("POST /api/groups error:", error);

    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์: " + (error.message || "Failed to create group"),
      },
      {
        status: 500,
      }
    );
  }
}