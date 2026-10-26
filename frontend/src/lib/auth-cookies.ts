import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "qcl_access_token";

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function setAccessToken(token: string, expiresAt?: string | Date) {
  const cookieStore = await cookies();
  const expires = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 8 * 3600 * 1000);

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function clearAccessToken() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
