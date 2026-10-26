"use client";

import React, { useMemo } from "react";
import type { QuizExamDetail } from "@/lib/api-client";
import { Users, QrCode } from "lucide-react";

interface CandidateCardProps {
  quiz: QuizExamDetail;
  userName?: string;
}

export function CandidateCard({ quiz, userName }: CandidateCardProps) {
  const currentDate = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const displayName = userName || "Học viên (Khách thi thử)";
  const licenseClass = quiz.licenseClassCode || "B2";
  const passScore = quiz.passScore ?? (quiz.totalQuestions === 35 ? 32 : Math.round(quiz.totalQuestions * 0.9));

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3 sm:p-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
        {/* Left: Avatar Silhouette */}
        <div className="sm:col-span-3 flex items-center justify-center">
          <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-md border border-border bg-muted/30 flex flex-col items-center justify-end overflow-hidden p-1 shadow-2xs">
            <svg
              viewBox="0 0 80 90"
              className="w-full h-full text-muted-foreground/45"
              fill="currentColor"
            >
              {/* Head */}
              <circle cx="40" cy="28" r="16" />
              {/* Shoulders */}
              <path d="M12 84 C12 58, 22 50, 40 50 C58 50, 68 58, 68 84 Z" />
            </svg>
          </div>
        </div>

        {/* Middle: Candidate Information */}
        <div className="sm:col-span-6 flex flex-col gap-1.5 justify-center leading-relaxed">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Họ và tên:</span>
            <span className="font-bold text-foreground truncate">{displayName}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Hạng xe:</span>
            <span className="font-bold text-foreground">
              {licenseClass} - {quiz.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Ngày thi:</span>
            <span className="font-mono text-foreground tabular-nums">{currentDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Trạng thái:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đang thi
            </span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-muted-foreground w-28 shrink-0">Bạn cần làm đúng:</span>
            <span className="font-mono font-bold text-foreground tabular-nums">
              {passScore}/{quiz.totalQuestions} câu
            </span>
          </div>
        </div>


      </div>
    </div>
  );
}
