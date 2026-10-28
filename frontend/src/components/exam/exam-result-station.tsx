"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { GradedQuestion } from "@/lib/api-client";
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  History,
  FolderSync,
  LogIn,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { CandidateCard } from "./candidate-card";
import { BarcodeStrip, DensityBar } from "@/components/telemetry/telemetry-primitives";

export interface ExamResultData {
  takeId?: number | null;
  quizId: number;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  passScore?: number;
  isPassed?: boolean;
  hasCriticalError?: boolean;
  licenseClassCode?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
  completedAt?: string | null;
  isGuest?: boolean;
  userName?: string;
  questions: GradedQuestion[];
}

interface ExamResultStationProps {
  data: ExamResultData;
}

export function ExamResultStation({ data }: ExamResultStationProps) {
  const t = useTranslations("Result");

  // Tìm câu sai đầu tiên để ưu tiên hiển thị cho thí sinh xem lại ngay
  const firstWrongIndex = useMemo(() => {
    const idx = data.questions.findIndex((q) => q.status === "FALSE");
    return idx !== -1 ? idx : 0;
  }, [data.questions]);

  const [currentIndex, setCurrentIndex] = useState(firstWrongIndex);
  const [filterMode, setFilterMode] = useState<"ALL" | "WRONG" | "CRITICAL">("ALL");

  const passScore =
    data.passScore ??
    (data.totalQuestions === 35 ? 32 : Math.round(data.totalQuestions * 0.9));

  const isPassed =
    data.isPassed !== undefined
      ? data.isPassed
      : data.score >= passScore && !data.hasCriticalError;

  const currentQuestion = data.questions[currentIndex] || data.questions[0];

  // Thống kê phân loại kết quả
  const stats = useMemo(() => {
    let correctCount = 0;
    let wrongCount = 0;
    let notFinishedCount = 0;
    let criticalCount = 0;
    let criticalWrongCount = 0;

    data.questions.forEach((q) => {
      if (q.status === "TRUE") correctCount++;
      else if (q.status === "FALSE") wrongCount++;
      else notFinishedCount++;

      if (q.isCritical) {
        criticalCount++;
        if (q.status === "FALSE") criticalWrongCount++;
      }
    });

    return {
      correctCount,
      wrongCount,
      notFinishedCount,
      criticalCount,
      criticalWrongCount,
      accuracyPercent: Math.round((data.score / (data.totalQuestions || 1)) * 100),
    };
  }, [data.questions, data.score, data.totalQuestions]);

  // Tính thời gian làm bài
  const formattedDuration = useMemo(() => {
    const endStr = data.finishedAt || data.completedAt;
    if (!data.startedAt || !endStr) return "--:--";

    try {
      const start = new Date(data.startedAt).getTime();
      const end = new Date(endStr).getTime();
      const diffSec = Math.max(0, Math.floor((end - start) / 1000));
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    } catch {
      return "--:--";
    }
  }, [data.startedAt, data.finishedAt, data.completedAt]);

  // Định dạng ngày thi
  const examDateStr = useMemo(() => {
    const dateSource = data.finishedAt || data.completedAt || data.startedAt;
    if (!dateSource) return undefined;
    try {
      const d = new Date(dateSource);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return undefined;
    }
  }, [data.finishedAt, data.completedAt, data.startedAt]);

  // Tìm câu sai kế tiếp để nhảy nhanh
  const jumpToNextWrong = useCallback(() => {
    const wrongIndices: number[] = [];
    data.questions.forEach((q, idx) => {
      if (q.status === "FALSE") wrongIndices.push(idx);
    });

    if (wrongIndices.length === 0) return;

    const next = wrongIndices.find((idx) => idx > currentIndex);
    if (next !== undefined) {
      setCurrentIndex(next);
    } else {
      setCurrentIndex(wrongIndices[0]);
    }
  }, [data.questions, currentIndex]);

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(data.questions.length - 1, prev + 1));
      } else if (e.key.toLowerCase() === "w") {
        e.preventDefault();
        jumpToNextWrong();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data.questions.length, jumpToNextWrong]);

  // Chia 3 cột song song cho Ma trận câu hỏi
  const matrixColumns = useMemo(() => {
    const total = data.questions.length;
    const itemsPerCol = Math.ceil(total / 3);
    const cols: { question: GradedQuestion; index: number }[][] = [];

    const indexed = data.questions.map((q, idx) => ({ question: q, index: idx }));

    for (let i = 0; i < total; i += itemsPerCol) {
      cols.push(indexed.slice(i, i + itemsPerCol));
    }
    while (cols.length < 3) {
      cols.push([]);
    }
    return cols;
  }, [data.questions]);

  // Tên bộ đề gọn gàng (loại bỏ lặp mã hạng xe)
  const cleanQuizTitle = useMemo(() => {
    return (data.quizTitle || "Bài thi sát hạch lý thuyết")
      .replace(/\s*—\s*Hạng.*$/i, "")
      .trim();
  }, [data.quizTitle]);

  return (
    <div className="flex flex-col flex-1 max-w-[1380px] mx-auto w-full px-2 sm:px-4 py-2 sm:py-3 gap-3">
      {/* Thông báo chế độ Khách (Guest mode) */}
      {data.isGuest && (
        <div className="p-2.5 border border-border bg-card text-xs font-mono text-muted-foreground flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <BarcodeStrip height={10} bars={[1, 2, 1]} className="opacity-50" />
            <span>KẾT QUẢ THI THỬ VÃNG LAI (CHẾ ĐỘ KHÁCH)</span>
          </div>
          <Link
            href="/dang-nhap"
            className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-xs"
          >
            <LogIn className="size-3.5" />
            <span>ĐĂNG NHẬP ĐỂ LƯU KẾT QUẢ</span>
          </Link>
        </div>
      )}

      {/* Bố cục 2 Cột chuẩn Buồng Sát hạch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 items-start w-full">
        {/* ============================================================ */}
        {/* CỘT TRÁI (7/12): Chi tiết câu hỏi + Lời giải + Thông tin thí sinh */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Main Question Review Panel */}
          <div className="border border-border bg-card p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-4">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3 flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-2 py-0.5 border border-primary/40 bg-primary/10 text-primary tabular-nums">
                    QUESTION // {String(currentIndex + 1).padStart(2, "0")} / {data.questions.length}
                  </span>

                  {/* Status Indicator */}
                  {currentQuestion.status === "TRUE" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-bold border border-primary/40 bg-muted/30 text-primary">
                      <Check className="size-3.5 stroke-[3]" />
                      <span>ĐÚNG (+1)</span>
                    </span>
                  ) : currentQuestion.status === "FALSE" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-bold border border-destructive/30 bg-muted/30 text-destructive">
                      <X className="size-3.5 stroke-[3]" />
                      <span>TRẢ LỜI SAI</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-bold border border-border bg-muted/30 text-muted-foreground">
                      <span>CHƯA LÀM</span>
                    </span>
                  )}

                  {/* Critical Hazard Alert */}
                  {currentQuestion.isCritical && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-bold border border-destructive/30 bg-muted/30 text-destructive">
                      <ShieldAlert className="size-3.5" />
                      <span>ĐIỂM LIỆT</span>
                    </span>
                  )}
                </div>

                {/* Jump to next wrong question button */}
                {stats.wrongCount > 0 && (
                  <button
                    type="button"
                    onClick={jumpToNextWrong}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-border hover:border-destructive/60 bg-muted/30 hover:bg-muted/60 text-destructive transition-colors cursor-pointer"
                    title="Nhảy đến câu sai tiếp theo (W)"
                  >
                    <span>CÂU SAI TIẾP (W)</span>
                    <ChevronRight className="size-3" />
                  </button>
                )}
              </div>

              {/* Question Statement */}
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-relaxed font-sans">
                {currentQuestion.content}
              </h2>

              {/* Sa hình / Biển báo Image Canvas */}
              {currentQuestion.image && currentQuestion.image !== "none" && (
                <div className="relative w-full max-w-md mx-auto my-1 border border-border bg-background/50 flex items-center justify-center p-2 min-h-[160px]">
                  <img
                    src={currentQuestion.image}
                    alt={`Sa hình câu ${currentQuestion.id}`}
                    className="max-h-56 sm:max-h-64 max-w-full object-contain"
                    loading="eager"
                  />
                </div>
              )}

              {/* Answer Options Review */}
              <div className="flex flex-col gap-2 pt-1 font-sans">
                {currentQuestion.answers.map((ans, idx) => {
                  const optionNumber = idx + 1;
                  const isCorrectAnswer = ans.isCorrect;
                  const wasChosenByUser = currentQuestion.selectedAnswerId === ans.id;

                  let optionStyle = "border-border/70 text-foreground/80 bg-background/40";
                  let numBadgeStyle = "bg-muted/80 text-foreground border-border font-mono font-bold";
                  let labelBadge = null;

                  if (isCorrectAnswer && wasChosenByUser) {
                    optionStyle = "bg-primary/5 border-primary text-foreground font-semibold";
                    numBadgeStyle = "bg-primary text-primary-foreground border-primary";
                    labelBadge = (
                      <span className="ml-auto text-[10px] font-mono font-bold text-primary uppercase shrink-0">
                        ✓ ĐÚNG & BẠN ĐÃ CHỌN
                      </span>
                    );
                  } else if (isCorrectAnswer) {
                    optionStyle = "bg-primary/5 border-primary text-foreground font-semibold";
                    numBadgeStyle = "bg-primary text-primary-foreground border-primary";
                    labelBadge = (
                      <span className="ml-auto text-[10px] font-mono font-bold text-primary uppercase shrink-0">
                        ✓ ĐÁP ÁN ĐÚNG
                      </span>
                    );
                  } else if (wasChosenByUser) {
                    optionStyle = "bg-background border-destructive/60 text-foreground font-medium";
                    numBadgeStyle = "bg-destructive/10 text-destructive border-destructive/50";
                    labelBadge = (
                      <span className="ml-auto text-[10px] font-mono font-bold text-destructive uppercase shrink-0">
                        ✗ BẠN ĐÃ CHỌN SAI
                      </span>
                    );
                  }

                  return (
                    <div
                      key={ans.id}
                      className={`flex items-start gap-3 p-3 text-xs sm:text-sm border transition-all ${optionStyle}`}
                    >
                      <span
                        className={`size-6 flex items-center justify-center text-xs shrink-0 border ${numBadgeStyle}`}
                      >
                        {optionNumber}
                      </span>
                      <span className="leading-relaxed pt-0.5 text-foreground/90 flex-1">
                        {ans.content}
                      </span>
                      {labelBadge}
                    </div>
                  );
                })}
              </div>

              {/* Giải thích đáp án chi tiết & Căn cứ */}
              {currentQuestion.explanation && (
                <div className="p-3 border border-border bg-background/60 flex flex-col gap-1 text-xs font-mono mt-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-[11px] uppercase">
                    <Lightbulb className="size-3.5 text-primary" />
                    <span>{"//"} GIẢI THÍCH CHI TIẾT & CĂN CỨ LUẬT GTĐB</span>
                  </div>
                  <p className="text-foreground/90 font-sans text-xs leading-relaxed pt-0.5 whitespace-pre-line">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Strip */}
            <div className="flex items-center justify-between border-t border-border/70 pt-3 mt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary hover:bg-muted/40 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>CÂU TRƯỚC</span>
              </button>

              <span className="hidden sm:inline text-[11px] text-muted-foreground">
                [← / →] ĐỔI CÂU • [W] CÂU SAI TIẾP
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(data.questions.length - 1, prev + 1))
                }
                disabled={currentIndex === data.questions.length - 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary hover:bg-muted/40 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <span>CÂU TIẾP</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Candidate Status Telemetry Strip */}
          <CandidateCard
            quiz={{
              licenseClassCode: data.licenseClassCode || "B",
              totalQuestions: data.totalQuestions,
              passScore: passScore,
              title: cleanQuizTitle,
            }}
            userName={data.userName}
            licenseClassCode={data.licenseClassCode || "B"}
            passScore={passScore}
            totalQuestions={data.totalQuestions}
            dateStr={examDateStr}
          />
        </div>

        {/* ============================================================ */}
        {/* CỘT PHẢI (5/12): Telemetry Verdict + 3-Column Question Matrix */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex flex-col gap-3 font-mono">
          {/* Top: Result Telemetry Verdict Banner */}
          <div className="border border-border bg-card p-3 flex flex-col gap-2.5 select-none">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                {isPassed ? (
                  <CheckCircle2 className="size-6 text-primary shrink-0" />
                ) : (
                  <XCircle className="size-6 text-destructive shrink-0" />
                )}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-extrabold text-sm sm:text-base uppercase tracking-wider ${
                        isPassed ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {isPassed ? "KẾT QUẢ // ĐẠT" : "KẾT QUẢ // KHÔNG ĐẠT"}
                    </span>
                    {data.hasCriticalError && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-bold border border-destructive/40 bg-muted/40 text-destructive uppercase">
                        <ShieldAlert className="size-3 shrink-0" />
                        <span>SAI CÂU ĐIỂM LIỆT</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-sans">
                    {cleanQuizTitle}
                    {data.licenseClassCode && ` • Hạng ${data.licenseClassCode}`}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-2xl font-black font-mono tabular-nums ${
                    isPassed ? "text-primary" : "text-destructive"
                  }`}
                >
                  {data.score}/{data.totalQuestions}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  ĐIỂM ĐẠT: ≥ {passScore}
                </span>
              </div>
            </div>

            {/* 4-Box Telemetry Matrix Overview */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              <div className="p-1.5 border border-border/60 bg-background/50 flex flex-col">
                <span className="text-[9px] uppercase text-muted-foreground">QUY CÁCH</span>
                <span className="font-bold text-foreground tabular-nums">
                  {data.totalQuestions} CÂU
                </span>
              </div>
              <div className="p-1.5 border border-border/60 bg-background/50 flex flex-col">
                <span className="text-[9px] uppercase text-muted-foreground">SỐ CÂU ĐÚNG</span>
                <span className="font-bold text-primary tabular-nums">
                  {stats.correctCount} ({stats.accuracyPercent}%)
                </span>
              </div>
              <div className="p-1.5 border border-border/60 bg-background/50 flex flex-col">
                <span className="text-[9px] uppercase text-muted-foreground">SỐ CÂU SAI</span>
                <span className="font-bold text-destructive tabular-nums">
                  {stats.wrongCount} CÂU
                </span>
              </div>
              <div className="p-1.5 border border-border/60 bg-background/50 flex flex-col">
                <span className="text-[9px] uppercase text-muted-foreground">THỜI GIAN</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formattedDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Middle: 3-Column Question Matrix Review Station */}
          <div className="border border-border bg-card p-2 sm:p-2.5 flex flex-col gap-2 font-mono text-xs select-none w-full">
            {/* Header tích hợp Filter tabs và DensityBar */}
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-border/70 text-[11px] flex-wrap gap-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold uppercase text-foreground">
                  {"//"} MA TRẬN KẾT QUẢ
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[10px]">TỶ LỆ ĐÚNG:</span>
                <DensityBar
                  value={stats.correctCount}
                  max={data.totalQuestions}
                  segments={10}
                  className="text-[10px]"
                />
              </div>
            </div>

            {/* Quick Filter Strip */}
            <div className="grid grid-cols-3 gap-1 text-[11px] pb-1">
              <button
                type="button"
                onClick={() => setFilterMode("ALL")}
                className={`py-1 px-1.5 border text-center font-bold transition-colors cursor-pointer ${
                  filterMode === "ALL"
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                TẤT CẢ ({data.questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("WRONG")}
                className={`py-1 px-1.5 border text-center font-bold transition-colors cursor-pointer ${
                  filterMode === "WRONG"
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-destructive hover:bg-muted/30"
                }`}
              >
                CÂU SAI ({stats.wrongCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("CRITICAL")}
                className={`py-1 px-1.5 border text-center font-bold transition-colors cursor-pointer ${
                  filterMode === "CRITICAL"
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                ĐIỂM LIỆT ({stats.criticalCount})
              </button>
            </div>

            {/* Grid 3 cột song song chuẩn buồng thi */}
            <div className="grid grid-cols-3 gap-1.5 pb-0.5 overflow-y-auto max-h-[520px] w-full">
              {matrixColumns.map((colItems, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1 min-w-0">
                  {colItems.map(({ question: q, index: globalIndex }) => {
                    // Áp dụng filter mode
                    if (filterMode === "WRONG" && q.status !== "FALSE") return null;
                    if (filterMode === "CRITICAL" && !q.isCritical) return null;

                    const isCurrent = globalIndex === currentIndex;
                    const isCorrect = q.status === "TRUE";
                    const isWrong = q.status === "FALSE";
                    const formattedNum = String(globalIndex + 1).padStart(2, "0");

                    // Option count
                    const optionCount = Math.max(2, q.answers?.length || 4);
                    const optionIndices = Array.from({ length: optionCount }, (_, i) => i);

                    // Row styling: Giữ nền tự nhiên bg-background/80, không phủ đỏ cả khối
                    let rowStyle = "bg-background/80 border-border/60 hover:border-border text-foreground";
                    if (isCurrent) {
                      rowStyle = "ring-1 ring-primary bg-muted/50 border-primary font-bold shadow-xs";
                    }

                    return (
                      <div
                        key={q.id}
                        onClick={() => setCurrentIndex(globalIndex)}
                        className={`flex items-center justify-between px-1.5 py-1 border transition-colors cursor-pointer ${rowStyle}`}
                        title={`Xem câu ${globalIndex + 1}: ${isCorrect ? "Đúng" : isWrong ? "Sai" : "Chưa làm"}`}
                      >
                        {/* Left: Question Number + Status Icon */}
                        <div className="flex items-center gap-1 font-mono text-xs font-bold tabular-nums pr-1 shrink-0">
                          <span
                            className={
                              isCorrect
                                ? "text-primary"
                                : isWrong
                                ? "text-destructive font-black"
                                : "text-muted-foreground"
                            }
                          >
                            {formattedNum}
                          </span>
                          {q.isCritical && (
                            <span
                              className="size-1.5 rounded-full bg-destructive/70"
                              title="Câu điểm liệt"
                            />
                          )}
                        </div>

                        {/* Right: Answer Checkboxes (1 2 3 4) showing chosen & correct */}
                        <div className="flex items-center gap-1 shrink-0">
                          {optionIndices.map((optIdx) => {
                            const answer = q.answers?.[optIdx];
                            if (!answer) return null;

                            const isChosen = q.selectedAnswerId === answer.id;
                            const isCorrectOpt = answer.isCorrect;

                            let checkStyle = "border-border/60 bg-background text-transparent";

                            if (isCorrectOpt && isChosen) {
                              checkStyle = "bg-primary text-primary-foreground border-primary font-bold";
                            } else if (isCorrectOpt) {
                              checkStyle = "bg-muted text-primary border-primary/60 font-bold";
                            } else if (isChosen) {
                              checkStyle = "bg-muted text-destructive border-destructive/60 font-bold";
                            }

                            return (
                              <div
                                key={answer.id}
                                className={`size-3.5 border flex items-center justify-center text-[9px] ${checkStyle}`}
                              >
                                {isCorrectOpt ? (
                                  <Check className="size-2.5 stroke-[3]" />
                                ) : isChosen ? (
                                  <X className="size-2.5 stroke-[3]" />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2">
            {/* Primary Action Button: Làm lại đề này */}
            <Link
              href={`/thi-sat-hach/${data.quizId}`}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all select-none shadow-xs"
            >
              <BarcodeStrip height={12} className="opacity-80" />
              <RotateCcw className="size-4" />
              <span>{t("retake")}</span>
              <BarcodeStrip height={12} className="opacity-80" />
            </Link>

            {/* Utility Quick Nav Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/"
                className="py-2 px-3 border border-border hover:border-primary hover:bg-muted/40 text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <FolderSync className="size-3.5 text-muted-foreground" />
                <span>DANH SÁCH BỘ ĐỀ</span>
              </Link>

              {data.isGuest ? (
                <Link
                  href="/dang-nhap"
                  className="py-2 px-3 border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogIn className="size-3.5" />
                  <span>ĐĂNG NHẬP LƯU KẾT QUẢ</span>
                </Link>
              ) : (
                <Link
                  href="/lich-su"
                  className="py-2 px-3 border border-border hover:border-primary hover:bg-muted/40 text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <History className="size-3.5 text-muted-foreground" />
                  <span>LỊCH SỬ THI</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
