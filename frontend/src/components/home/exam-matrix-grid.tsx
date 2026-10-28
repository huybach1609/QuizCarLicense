"use client";

import { Link } from "@/i18n/routing";
import type { LicenseClass, QuizSummary } from "@/lib/api-client";
import { BarcodeStrip, AnimatedNumber } from "@/components/telemetry/telemetry-primitives";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

interface ExamMatrixGridProps {
  officialExams: QuizSummary[];
  activeLicense: LicenseClass;
}

export function ExamMatrixGrid({ officialExams, activeLicense }: ExamMatrixGridProps) {
  return (
    <div key={activeLicense.code} className="flex flex-col gap-4 select-none animate-calibrate">
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-0.5">
        <h2 className="font-bold uppercase tracking-wider text-foreground text-xs font-mono m-0">
          {"//"} LIVE STREAMS: {officialExams.length} BỘ ĐỀ SÁT HẠCH TIÊU CHUẨN
        </h2>
        <span className="hidden sm:inline">
          THỜI GIAN:{" "}
          <strong className="text-foreground">
            <AnimatedNumber value={activeLicense.durationMinutes} /> PHÚT
          </strong>{" "}
          • ĐIỂM ĐẠT:{" "}
          <strong className="text-primary">
            <AnimatedNumber value={activeLicense.passScore} />/
            <AnimatedNumber value={activeLicense.totalQuestions} />
          </strong>
        </span>
      </div>

      {officialExams.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {officialExams.map((quiz, index) => {
            const bayNumber = String(quiz.examNumber ?? index + 1).padStart(2, "0");
            const duration = quiz.durationMinutes ?? activeLicense.durationMinutes;
            const passScore = quiz.passScore ?? activeLicense.passScore;

            return (
              <Link
                key={quiz.quizId}
                href={`/thi-sat-hach/${quiz.quizId}`}
                className="group relative p-3 border border-border bg-card hover:border-primary hover:bg-muted/30 transition-all duration-200 flex flex-col justify-between gap-3 font-mono active:scale-[0.98]"
              >
                {/* Top: Bay Name & Pass Score */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    BAY {bayNumber}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 tabular-nums rounded-none border-border group-hover:border-primary/50 group-hover:text-primary"
                  >
                    {passScore}/{quiz.totalQuestions}
                  </Badge>
                </div>

                {/* Center: Micro-barcode trace */}
                <div className="flex items-center justify-between py-1 border-y border-border/50 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{duration}M</span>
                  </span>
                  <BarcodeStrip height={8} bars={[1, 2, 1, 1, 2]} className="opacity-50 group-hover:opacity-100" />
                </div>

                {/* Bottom: Status & Launch indicator */}
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <span className="text-[10px] text-primary font-bold">READY</span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>VÀO THI</span>
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-border bg-card/40 text-center font-mono text-xs text-muted-foreground">
          {"// CHƯA CÓ DỮ LIỆU BỘ ĐỀ SÁT HẠCH CHO HẠNG NÀY."}
        </div>
      )}
    </div>
  );
}
