"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { ShieldCheck, History, BookOpen, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

export function SiteHeader() {
  const t = useTranslations("Common");
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs tracking-wider">
            QCL
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
            QuizCarLicense
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
          <Link href="/cau-hoi" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t("questions")}</span>
          </Link>

          {user && (
            <Link href="/lich-su" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>{t("history")}</span>
            </Link>
          )}

          {user?.role === "Admin" && (
            <Link
              href="/admin/quizzes"
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t("admin")}</span>
            </Link>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <span className="text-xs font-medium text-foreground hidden sm:inline-block max-w-[120px] truncate">
                {user.fullName || user.username}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md border border-border/70 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                title={t("logout")}
                aria-label={t("logout")}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors ml-1"
            >
              <User className="w-3 h-3" />
              <span>{t("login")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
