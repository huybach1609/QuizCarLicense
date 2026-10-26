import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { fetchApi, type AuthUser } from "@/lib/api-client";
import { ShieldCheck, HelpCircle, BookOpen, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { data: user, status } = await fetchApi<AuthUser>("/api/v1/auth/me", {
    cache: "no-store",
  });

  if (status === 401 || !user || user.role !== "Admin") {
    redirect(`/${locale}/dang-nhap`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 w-full flex-1">
      {/* Admin Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Bảng Quản Trị Hệ Thống
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/quizzes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors text-foreground"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>Quản lý Đề thi</span>
          </Link>
          <Link
            href="/admin/questions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors text-foreground"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Ngân hàng 600 Câu</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pl-2"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Thoát</span>
          </Link>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
