"use client";

import { Link } from "@/i18n/routing";
import type { LicenseClass, QuizSummary, PracticeLicenseSummary } from "@/lib/api-client";
import { DensityBar, BarcodeStrip, AnimatedNumber } from "@/components/telemetry/telemetry-primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Flame, ArrowRight } from "lucide-react";

interface PracticeTelemetryPanelProps {
  activeLicense: LicenseClass;
  currentPractice: PracticeLicenseSummary;
  criticalQuiz?: QuizSummary;
  frequentMistakesQuiz?: QuizSummary;
  chapterPracticeQuizzes: QuizSummary[];
  chapterTitles: Record<number, string>;
}

export function PracticeTelemetryPanel({
  activeLicense,
  currentPractice,
  criticalQuiz,
  frequentMistakesQuiz,
  chapterPracticeQuizzes,
  chapterTitles,
}: PracticeTelemetryPanelProps) {
  return (
    <div key={activeLicense.code} className="flex flex-col gap-6 select-none animate-calibrate">
      {/* 2 Special Focus Hazard Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: Critical Questions Hazard */}
        <div className="border border-destructive/40 bg-card p-4 sm:p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-colors hover:border-destructive/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 border border-destructive/50 bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                <ShieldAlert className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono text-destructive uppercase tracking-wider font-bold">
                  HAZARD MODULE // CRITICAL SAFETY
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground font-mono">
                  Bộ Câu Hỏi Điểm Liệt (
                  <AnimatedNumber value={currentPractice.criticalCount} /> câu)
                </h3>
                <span className="text-xs text-muted-foreground font-sans">
                  Tình huống mất an toàn giao thông nghiêm trọng. Trả lời sai 1 câu bị đánh trượt trực tiếp.
                </span>
              </div>
            </div>

            <Badge variant="destructive" className="font-mono text-xs shrink-0 rounded-none px-2 py-0.5">
              <AnimatedNumber value={currentPractice.criticalCount} /> CÂU
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-destructive/20 text-xs font-mono">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <BarcodeStrip height={10} bars={[1, 3, 1, 2, 1]} className="text-destructive" />
              CHẾ ĐỘ XEM ĐÁP ÁN NGAY
            </span>
            <Button
              size="sm"
              variant="destructive"
              render={
                <Link
                  href={`/thi-sat-hach/${criticalQuiz?.quizId ?? 0}?licenseCode=${activeLicense.code}`}
                />
              }
              nativeButton={false}
              className="h-8 gap-2 px-3 text-xs font-bold uppercase rounded-none cursor-pointer"
            >
              <span>Ôn tập ngay</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Module 2: Frequent Mistakes Anomaly */}
        <div className="border border-warning/40 bg-card p-4 sm:p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-colors hover:border-warning/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 border border-warning/50 bg-warning/10 flex items-center justify-center text-warning shrink-0">
                <Flame className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono text-warning uppercase tracking-wider font-bold">
                  ANOMALY FILTER // HIGH ERROR RATE
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground font-mono">
                  Câu Hỏi Hay Nhầm Lẫn (
                  <AnimatedNumber value={currentPractice.frequentMistakesCount} /> câu)
                </h3>
                <span className="text-xs text-muted-foreground font-sans">
                  Tổng hợp các câu lý thuyết, biển báo và sa hình thí sinh trả lời sai nhiều nhất qua các kỳ thi.
                </span>
              </div>
            </div>

            <Badge
              variant="outline"
              className="font-mono text-xs border-warning/50 text-warning bg-warning/10 shrink-0 rounded-none px-2 py-0.5"
            >
              <AnimatedNumber value={currentPractice.frequentMistakesCount} /> CÂU
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-warning/20 text-xs font-mono">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <BarcodeStrip height={10} bars={[2, 1, 2, 1, 3]} className="text-warning" />
              TỰ ĐỘNG CHẤM ĐIỂM
            </span>
            <Button
              size="sm"
              variant="secondary"
              render={
                <Link
                  href={`/thi-sat-hach/${frequentMistakesQuiz?.quizId ?? 0}?licenseCode=${activeLicense.code}`}
                />
              }
              nativeButton={false}
              className="h-8 gap-2 px-3 text-xs font-bold uppercase rounded-none border border-border hover:border-warning/50 cursor-pointer"
            >
              <span>Ôn tập ngay</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 6-Chapter Telemetry Diagnostic Table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-0.5">
          <span className="font-bold text-foreground uppercase tracking-wider">
            {"//"} 6 CHƯƠNG LÝ THUYẾT (<AnimatedNumber value={currentPractice.totalQuestions} /> CÂU HỎI)
          </span>
          <span className="text-primary hidden sm:inline">
            CHẾ ĐỘ ÔN LUYỆN
          </span>
        </div>

        <div className="border border-border bg-card divide-y divide-border/70 overflow-hidden">
          {chapterPracticeQuizzes.map((quiz) => {
            const chapterInfo = currentPractice.chapters.find(
              (c) => c.quizId === quiz.quizId || c.examNumber === quiz.examNumber
            );
            const isApplicable = chapterInfo ? chapterInfo.isApplicable : true;
            const chapterQuestionCount = chapterInfo
              ? chapterInfo.totalQuestions
              : quiz.totalQuestions;
            const displayTitle = chapterTitles[quiz.examNumber ?? 1] || quiz.title;
            const chapterIndex = String(quiz.examNumber ?? 1).padStart(2, "0");

            return (
              <div
                key={quiz.quizId || quiz.examNumber}
                className={`p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 border-l-2 ${
                  !isApplicable
                    ? "bg-muted/20 opacity-40 border-l-transparent"
                    : "border-l-transparent hover:border-l-primary hover:bg-muted/40"
                }`}
              >
                {/* Index & Title */}
                <div className="flex items-center gap-3">
                  <span className="size-7 border border-border bg-background flex items-center justify-center text-xs font-bold font-mono text-foreground shrink-0">
                    {chapterIndex}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-foreground font-sans">
                      {displayTitle}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {!isApplicable
                        ? `// MIỄN THI Ở ${activeLicense.name} (CHỈ ÁP DỤNG Ô TÔ)`
                        : `// MODULE-${chapterIndex} • PHÂN PHỐI ${chapterQuestionCount} CÂU`}
                    </span>
                  </div>
                </div>

                {/* Progress Density Bar & Action CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 font-mono text-xs">
                  {isApplicable ? (
                    <DensityBar
                      value={chapterQuestionCount}
                      max={currentPractice.totalQuestions || 600}
                      className="hidden md:flex"
                    />
                  ) : null}

                  <Badge variant="outline" className="tabular-nums font-mono text-xs rounded-none px-2 py-0.5 border-border">
                    <AnimatedNumber value={chapterQuestionCount} /> câu
                  </Badge>

                  {!isApplicable ? (
                    <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 bg-muted/60 border border-border">
                      MIỄN THI
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      render={
                        <Link
                          href={`/thi-sat-hach/${quiz.quizId}?licenseCode=${activeLicense.code}`}
                        />
                      }
                      nativeButton={false}
                      className="h-8 gap-1.5 px-3 text-xs font-mono font-bold uppercase rounded-none hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      <span>Luyện tập</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
