import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    model_loaded: true,
    loading: false,
    error: null,
  })
}
