"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { User, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";

function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const setUser = useAuthStore((s) => s.setUser);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || data.title || "Đăng nhập thất bại.");
        }

        if (data.user) {
          setUser(data.user);
        }

        router.push(redirectUrl);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Đăng nhập thất bại.";
        setError(msg);
      }
    });
  };

  return (
    <div className="w-full max-w-sm p-6 rounded-lg border border-border/80 bg-card shadow-xs flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{t("loginTitle")}</h1>
        <p className="text-xs text-muted-foreground">Nhập thông tin để tiếp tục làm bài thi</p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <fieldset disabled={isPending} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">{t("username")}</label>
            <div className="relative flex items-center">
              <User className="size-3.5 text-muted-foreground absolute left-3" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: hocvien_01"
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground">{t("password")}</label>
            <div className="relative flex items-center">
              <Lock className="size-3.5 text-muted-foreground absolute left-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-9 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>{t("loginButton")}</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </fieldset>
      </form>

      <div className="text-center text-xs text-muted-foreground border-t border-border/50 pt-3">
        <span>{t("noAccount")} </span>
        <Link href="/dang-ky" className="font-semibold text-primary hover:underline">
          {t("registerButton")}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-sm h-64 rounded-lg border border-border/80 bg-card animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
