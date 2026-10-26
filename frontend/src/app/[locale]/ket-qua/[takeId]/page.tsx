import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { fetchApi, type GradedQuestion } from "@/lib/api-client";
import { CheckCircle2, XCircle, RotateCcw, ArrowLeft, History } from "lucide-react";

interface TakeDetailData {
  takeId: number;
  quizId: number;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt: string | null;
  questions: GradedQuestion[];
}

export default async function SavedResultPage({
  params,
}: {
  params: Promise<{ locale: string; takeId: string }>;
}) {
  const { locale, takeId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Result");

  const { data: take, status } = await fetchApi<TakeDetailData>(`/api/v1/takes/${takeId}`, {
    cache: "no-store",
  });

  if (status === 401) {
    redirect(`/${locale}/dang-nhap`);
  }

  if (!take) {
    notFound();
  }

  const isPass = take.score >= Math.round(take.totalQuestions * 0.9);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 w-full">
      {/* Thẻ tổng kết điểm số */}
      <div
        className={`p-6 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isPass
            ? "bg-primary/5 border-primary/30"
            : "bg-destructive/5 border-destructive/30"
        }`}
      >
        <div className="flex items-center gap-3.5">
          {isPass ? (
            <CheckCircle2 className="w-10 h-10 text-primary shrink-0" />
          ) : (
            <XCircle className="w-10 h-10 text-destructive shrink-0" />
          )}
          <div className="flex flex-col">
            <span
              className={`text-lg font-bold tracking-tight ${
                isPass ? "text-primary" : "text-destructive"
              }`}
            >
              {isPass ? t("passed") : t("failed")}
            </span>
            <span className="text-xs text-muted-foreground">{take.quizTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center sm:text-right">
            <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
              {take.score} / {take.totalQuestions}
            </span>
            <span className="block text-[11px] text-muted-foreground">điểm số đạt được</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/thi-sat-hach/${take.quizId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border/80 text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("retake")}</span>
            </Link>

            <Link
              href="/lich-su"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Chi tiết bài làm */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm text-foreground">{t("reviewAnswers")}</h3>

        <div className="flex flex-col gap-3">
          {take.questions.map((q, idx) => {
            const isCorrect = q.status === "TRUE";
            const isNotFinished = q.status === "NOTFINISH";

            return (
              <div
                key={q.id}
                className={`p-4 rounded-lg border flex flex-col gap-3 bg-card transition-colors ${
                  isCorrect
                    ? "border-primary/30"
                    : isNotFinished
                    ? "border-border/60"
                    : "border-destructive/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold font-mono text-muted-foreground tabular-nums">
                    CÂU {idx + 1}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isCorrect
                        ? "bg-primary/10 text-primary"
                        : isNotFinished
                        ? "bg-muted text-muted-foreground"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {isCorrect
                      ? t("correct")
                      : isNotFinished
                      ? t("notAnswered")
                      : t("incorrect")}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  {q.content}
                </p>

                {q.image && q.image !== "none" && (
                  <div className="relative w-full max-w-sm h-40 rounded-md border border-border overflow-hidden my-1">
                    <Image
                      src={q.image}
                      alt={`Minh họa câu hỏi ${q.id}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 pt-1">
                  {q.answers.map((ans, aIdx) => {
                    const letter = String.fromCharCode(65 + aIdx);
                    const wasSelected = q.selectedAnswerId === ans.id;

                    let rowStyle = "border-border/50 text-muted-foreground";
                    if (ans.isCorrect) {
                      rowStyle = "bg-primary/10 border-primary/50 text-foreground font-medium";
                    } else if (wasSelected && !ans.isCorrect) {
                      rowStyle =
                        "bg-destructive/10 border-destructive/40 text-destructive font-medium line-through";
                    }

                    return (
                      <div
                        key={ans.id}
                        className={`flex items-start gap-2.5 p-2 rounded text-xs border ${rowStyle}`}
                      >
                        <span className="font-mono font-semibold shrink-0">{letter}.</span>
                        <span>{ans.content}</span>
                        {ans.isCorrect && (
                          <span className="ml-auto text-[10px] font-semibold text-primary">
                            Đáp án đúng
                          </span>
                        )}
                        {wasSelected && !ans.isCorrect && (
                          <span className="ml-auto text-[10px] font-semibold text-destructive">
                            Bạn đã chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
