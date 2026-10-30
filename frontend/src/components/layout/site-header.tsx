"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { ShieldCheck, History, BookOpen, User, LogOut, Menu } from "lucide-react";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function SiteHeader() {
  const t = useTranslations("Common");
  const router = useRouter();
  const { user, isInitialized, fetchUser, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      fetchUser();
    }
  }, [isInitialized, fetchUser]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Telemetry Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group font-mono">
            <div className="size-7 rounded-none border border-primary bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs tracking-wider">
              QCL
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                QUIZCARLICENSE
              </span>
            </div>
          </Link>
          <BarcodeStrip height={12} bars={[1, 3, 1, 2, 1]} className="hidden md:block opacity-40 ml-1" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/cau-hoi" />}
            nativeButton={false}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="size-3.5" />
            <span>{t("questions")}</span>
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/lich-su" />}
              nativeButton={false}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <History className="size-3.5" />
              <span>{t("history")}</span>
            </Button>
          )}

          {user?.role === "Admin" && (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/admin/quizzes" />}
              nativeButton={false}
              className="h-8 gap-1.5 text-xs text-primary hover:text-primary font-semibold"
            >
              <ShieldCheck className="size-3.5" />
              <span>{t("admin")}</span>
            </Button>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />

          {/* Desktop User Section */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground max-w-[120px] truncate">
                  {user.fullName || user.username}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="size-8 text-muted-foreground hover:text-destructive"
                  title={t("logout")}
                  aria-label={t("logout")}
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                render={<Link href="/dang-nhap" />}
                nativeButton={false}
                className="h-8 gap-1.5 px-3 text-xs font-medium"
              >
                <User className="size-3.5" />
                <span>{t("login")}</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 md:hidden text-muted-foreground hover:text-foreground"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col p-6">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 text-base font-bold">
                  <span className="size-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    QCL
                  </span>
                  QuizCarLicense
                </SheetTitle>
              </SheetHeader>

              <Separator className="my-4" />

              <nav className="flex flex-col gap-1.5 flex-1">
                <Button
                  variant="ghost"
                  render={<Link href="/cau-hoi" />}
                  nativeButton={false}
                  className="justify-start gap-2.5 h-10 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <BookOpen className="size-4" />
                  <span>{t("questions")}</span>
                </Button>

                {user && (
                  <Button
                    variant="ghost"
                    render={<Link href="/lich-su" />}
                    nativeButton={false}
                    className="justify-start gap-2.5 h-10 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <History className="size-4" />
                    <span>{t("history")}</span>
                  </Button>
                )}

                {user?.role === "Admin" && (
                  <Button
                    variant="ghost"
                    render={<Link href="/admin/quizzes" />}
                    nativeButton={false}
                    className="justify-start gap-2.5 h-10 text-sm font-semibold text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ShieldCheck className="size-4" />
                    <span>{t("admin")}</span>
                  </Button>
                )}
              </nav>

              <Separator className="my-4" />

              <div className="pt-2">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-muted-foreground truncate">
                      Đăng nhập: <strong className="text-foreground">{user.fullName || user.username}</strong>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="size-4" />
                      <span>{t("logout")}</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    render={<Link href="/dang-nhap" />}
                    nativeButton={false}
                    className="w-full justify-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="size-4" />
                    <span>{t("login")}</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
