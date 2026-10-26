import { NextResponse } from "next/server";
import { setAccessToken } from "@/lib/auth-cookies";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:5254";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // Lưu JWT vào HttpOnly Cookie
    if (data.accessToken) {
      await setAccessToken(data.accessToken, data.expiresAt);
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
