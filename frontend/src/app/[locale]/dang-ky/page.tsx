"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { User, Lock, UserCheck, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.title || "Đăng ký thất bại.");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm p-6 rounded-lg border border-border/80 bg-card shadow-xs flex flex-col gap-5">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t("registerTitle")}</h1>
          <p className="text-xs text-muted-foreground">Tạo tài khoản để lưu lại kết quả bài thi</p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">{t("username")}</label>
            <div className="relative flex items-center">
              <User className="w-3.5 h-3.5 text-muted-foreground absolute left-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">{t("fullName")}</label>
            <div className="relative flex items-center">
              <UserCheck className="w-3.5 h-3.5 text-muted-foreground absolute left-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">{t("password")}</label>
            <div className="relative flex items-center">
              <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>{loading ? "Đang xử lý..." : t("registerButton")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground border-t border-border/50 pt-3">
          <span>{t("hasAccount")} </span>
          <Link href="/dang-nhap" className="font-semibold text-primary hover:underline">
            {t("login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
