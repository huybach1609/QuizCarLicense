import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetchApi, type LicenseClass, type QuizSummary } from "@/lib/api-client";
import { LicenseSelectorBoard } from "@/components/home/license-selector-board";
import { BookOpen } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const [{ data: licenses }, { data: quizzes }] = await Promise.all([
    fetchApi<LicenseClass[]>("/api/v1/license-classes", {
      next: { revalidate: 300 },
    }),
    fetchApi<QuizSummary[]>("/api/v1/quizzes", {
      next: { revalidate: 300 },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8 py-8 max-w-6xl mx-auto px-4 w-full">
      {/* Hero Section */}
      <section className="border-b border-border/70 pb-8">
        <div className="max-w-3xl flex flex-col gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary w-fit border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Thông tư 108/2026/TT-BCA — Chuẩn 11 Hạng Sát Hạch GPLX</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {t("heroTitle")}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/cau-hoi"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium border border-border/60 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>{t("studyQuestions")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Bảng điều khiển 11 Hạng GPLX + Bộ đề cố định + Đề ngẫu nhiên + Ôn tập theo Chương */}
      <LicenseSelectorBoard
        licenses={licenses ?? []}
        quizzes={quizzes ?? []}
      />
    </div>
  );
}
