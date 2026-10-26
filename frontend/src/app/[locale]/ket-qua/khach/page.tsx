"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { TestSubmitResult } from "@/lib/api-client";
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";

export default function GuestResultPage() {
  const t = useTranslations("Result");
  const [result, setResult] = useState<TestSubmitResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("qcl_guest_result");
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch {
        // Parse error
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
        <p className="text-sm text-muted-foreground">Không tìm thấy kết quả làm bài gần nhất.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    );
  }

  // Tiêu chuẩn sát hạch B2: >= 32/35 câu
  const isPass = result.score >= Math.round(result.totalQuestions * 0.9);

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
            <span className="text-xs text-muted-foreground">{result.quizTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center sm:text-right">
            <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
              {result.score} / {result.totalQuestions}
            </span>
            <span className="block text-[11px] text-muted-foreground">điểm số đạt được</span>
          </div>

          <Link
            href={`/thi-sat-hach/${result.quizId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground border border-border/80 text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("retake")}</span>
          </Link>
        </div>
      </div>

      {/* Thông báo chế độ khách */}
      <div className="p-3.5 rounded-md border border-border bg-card text-xs text-muted-foreground flex items-center justify-between">
        <span>{t("guestNotice")}</span>
        <Link href="/dang-nhap" className="font-semibold text-primary hover:underline">
          Đăng nhập ngay
        </Link>
      </div>

      {/* Chi tiết từng câu hỏi đúng / sai */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm text-foreground">{t("reviewAnswers")}</h3>

        <div className="flex flex-col gap-3">
          {result.questions.map((q, idx) => {
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

                {/* Các đáp án */}
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
