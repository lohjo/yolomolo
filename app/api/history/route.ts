import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getSupabase } from "@/lib/supabase"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ entries: [], total: 0 })
  }

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100)
  const offset = parseInt(url.searchParams.get("offset") || "0", 10)

  const { data, error, count } = await supabase
    .from("history")
    .select("id, latex, raw_response, elapsed_ms, source_tab, created_at", {
      count: "exact",
    })
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data ?? [], total: count ?? 0 })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 })
  }

  const body = await request.json()
  const { latex, rawResponse, elapsedMs, sourceTab } = body

  if (!latex || typeof elapsedMs !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("history")
    .insert({
      user_id: session.user.id,
      latex,
      raw_response: rawResponse ?? null,
      elapsed_ms: elapsedMs,
      source_tab: sourceTab ?? "upload",
    })
    .select("id, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
