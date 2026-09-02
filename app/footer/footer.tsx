"use client";

import { GraduationCap, Code2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black text-white">

      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-60 w-60 rounded-full bg-blue-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-60 w-60 rounded-full bg-red-600/15 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-6">

        <div className="grid gap-6 md:grid-cols-2">

          {/* Project */}
          <div>
            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Code2 size={18} />
              </div>

              <div>
                <h2 className="text-base font-bold">
                  Project Track
                </h2>

                <p className="text-xs text-gray-500">
                  Information Technology
                </p>
              </div>

            </div>

            <p className="max-w-md text-xs leading-5 text-gray-400">
              ระบบติดตามและจัดการโปรเจกต์
              พัฒนาโดยนักศึกษาสาขาเทคโนโลยีสารสนเทศ
              วิทยาลัยเทคนิคเชียงใหม่
            </p>
          </div>

          {/* Members */}
          <div>

            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
              Project Members
            </h3>

            <div className="space-y-2">

              {/* Member 1 */}
              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-300 hover:border-blue-500/40 hover:bg-white/[0.06]">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm">
                  👨‍💻
                </div>

                <div>
                  <p className="text-sm font-medium group-hover:text-blue-400">
                    นายผไทภักดิ์ อาจวิจิตร
                  </p>

                  <p className="text-[11px] text-gray-500">
                    รหัส 036 · ปวส.2 สายตรง
                  </p>
                </div>

              </div>

              {/* Member 2 */}
              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-300 hover:border-red-500/40 hover:bg-white/[0.06]">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-sm">
                  👨‍💻
                </div>

                <div>
                  <p className="text-sm font-medium group-hover:text-red-400">
                    นายธนกฤต กุณะแสงคำ
                  </p>

                  <p className="text-[11px] text-gray-500">
                    รหัส 015 · ปวส.2 สายตรง
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">
            <GraduationCap className="text-blue-400" size={18} />

            <div>
              <p className="text-xs font-medium">
                วิทยาลัยเทคนิคเชียงใหม่
              </p>

              <p className="text-[10px] text-gray-500">
                แผนกเทคโนโลยีสารสนเทศ
              </p>
            </div>
          </div>

          <p className="text-[10px] text-gray-600">
            © 2026 Information Technology
          </p>

        </div>

      </div>
    </footer>
  );
}
