"use client";

import React, { useMemo } from "react";
import type { QuizExamDetail } from "@/lib/api-client";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";

interface CandidateCardProps {
  quiz?: Partial<QuizExamDetail>;
  userName?: string;
  licenseClassCode?: string | null;
  passScore?: number;
  totalQuestions?: number;
  dateStr?: string;
}

export function CandidateCard({
  quiz = {},
  userName,
  licenseClassCode,
  passScore: customPassScore,
  totalQuestions: customTotalQuestions,
  dateStr,
}: CandidateCardProps) {
  const currentDate = useMemo(() => {
    if (dateStr) return dateStr;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }, [dateStr]);

  const displayName = userName || "HỌC VIÊN (KHÁCH THI THỬ)";
  const licenseClass =
    licenseClassCode ||
    (quiz && "licenseClassCode" in quiz ? quiz.licenseClassCode : null) ||
    "B";
  const total =
    customTotalQuestions ??
    (quiz && "totalQuestions" in quiz ? quiz.totalQuestions : null) ??
    30;
  const passScore =
    customPassScore ??
    (quiz && "passScore" in quiz ? quiz.passScore : null) ??
    (total === 35 ? 32 : Math.round(total * 0.9));

  return (
    <div className="border border-border bg-card p-2.5 font-mono text-xs select-none">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        {/* Cell 1: Candidate Identity */}
        <div className="flex flex-col gap-0.5 justify-center sm:pr-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase">
            <BarcodeStrip height={8} bars={[1, 2, 1, 2]} className="opacity-60" />
            <span>THÍ SINH</span>
          </div>
          <span className="font-bold text-foreground truncate text-xs sm:text-[13px]">
            {displayName}
          </span>
        </div>

        {/* Cell 2: License Class */}
        <div className="flex flex-col gap-0.5 justify-center pt-2 sm:pt-0 sm:px-3">
          <span className="text-[10px] text-muted-foreground uppercase">HẠNG SÁT HẠCH</span>
          <span className="font-bold text-foreground truncate text-xs sm:text-[13px]">
            HẠNG {licenseClass} • {currentDate}
          </span>
        </div>

        {/* Cell 3: Passing Threshold */}
        <div className="flex flex-col gap-0.5 justify-center pt-2 sm:pt-0 sm:px-3">
          <span className="text-[10px] text-primary uppercase font-bold">CHUẨN ĐẠT TỐI THIỂU</span>
          <span className="font-bold text-primary tabular-nums text-xs sm:text-[13px]">
            {passScore}/{total} CÂU (≥ 90%)
          </span>
        </div>
      </div>
    </div>
  );
}
