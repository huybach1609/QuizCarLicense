import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetchApi, type QuizSummary } from "@/lib/api-client";
import { Clock, HelpCircle, ArrowRight, BookOpen, AlertTriangle } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");

  const { data: quizzes } = await fetchApi<QuizSummary[]>("/api/v1/quizzes", {
    next: { revalidate: 300 },
  });

  return (
    <div className="flex flex-col gap-10 py-10 max-w-6xl mx-auto px-4 w-full">
      {/* Hero Section */}
      <section className="border-b border-border/70 pb-10">
        <div className="max-w-3xl flex flex-col gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary w-fit border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Bộ GTVT 2026 — 600 Câu hỏi Sát hạch</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {t("heroTitle")}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
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

      {/* Quizzes List Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{t("exploreQuizzes")}</span>
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              ({quizzes?.length || 0})
            </span>
          </h2>
        </div>

        {quizzes && quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.quizId}
                className="group flex flex-col justify-between p-5 rounded-lg border border-border/80 bg-card hover:border-primary/50 transition-all shadow-xs"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <HelpCircle className="w-3.5 h-3.5 text-primary" />
                      <span>{t("totalQuestions", { count: quiz.totalQuestions })}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>19p</span>
                    </span>
                  </div>

                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {quiz.detail || "Bộ đề thi thử theo đúng chuẩn sát hạch."}
                  </p>
                </div>

                <div className="pt-5 mt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ID #{quiz.quizId}
                  </span>
                  <Link
                    href={`/thi-sat-hach/${quiz.quizId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <span>{t("startExam")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
            {tCommon("loading")}
          </div>
        )}
      </section>

      {/* Warning Alert: 60 Câu điểm liệt */}
      <section className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-semibold text-destructive">Lưu ý quan trọng về câu điểm liệt:</span>
          <span className="text-muted-foreground leading-relaxed">
            Trong mỗi đề thi sát hạch B1, B2, C, chỉ cần làm sai 1 câu hỏi điểm liệt thì toàn bộ bài thi sẽ bị đánh giá Không Đạt ngay lập tức.
          </span>
        </div>
      </section>
    </div>
  );
}
