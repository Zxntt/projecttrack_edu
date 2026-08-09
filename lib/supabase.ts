import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    'Missing Supabase env vars: ตรวจสอบ NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SECRET_KEY ใน .env.local'
  )
}

// ใช้ฝั่ง server (API routes) เท่านั้น เพราะ SUPABASE_SECRET_KEY มีสิทธิ์เต็ม (bypass RLS)
// ห้าม import ไฟล์นี้ในไฟล์ที่รันฝั่ง client (component ที่มี 'use client')
export const supabase = createClient(supabaseUrl, supabaseSecretKey)