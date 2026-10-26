import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-cookies";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:5254";

export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ user: null }, { status: res.status });
    }

    const user = await res.json();
    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
