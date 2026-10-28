"use client";

import { useEffect, useState, useMemo, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useExamStore } from "@/stores/use-exam-store";
import { useAuthStore } from "@/stores/use-auth-store";
import type { QuizExamDetail, TestSubmitResult } from "@/lib/api-client";
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  Maximize2,
  Minimize2,
  RefreshCw,
  FolderSync,
} from "lucide-react";
import { CandidateCard } from "./candidate-card";
import { QuestionMatrix } from "./question-matrix";
import { ExamGuideModal } from "./exam-guide-modal";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";

interface ExamEngineProps {
  quiz: QuizExamDetail;
}

export function ExamEngine({ quiz }: ExamEngineProps) {
  const t = useTranslations("Exam");
  const router = useRouter();

  const isPractice = Boolean(quiz.isPracticeMode);
  const examDurationMinutes = quiz.durationMinutes ?? (quiz.totalQuestions === 25 ? 19 : 20);

  const {
    currentSession,
    startSession,
    toggleAnswer,
    toggleFlag,
    setCurrentIndex,
    clearSession,
  } = useExamStore();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    examDurationMinutes * 60
  );

  // Khởi tạo hoặc khôi phục session
  useEffect(() => {
    startSession(
      quiz.quizId,
      quiz.title,
      examDurationMinutes,
      quiz.questions.map((q) => q.id)
    );
  }, [quiz, examDurationMinutes, startSession]);

  // Nộp bài thi
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !currentSession) return;
    setIsSubmitting(true);

    try {
      const selectedIds = Object.values(currentSession.selectedAnswers);
      const questionIds = quiz.questions.map((q) => q.id);

      const res = await fetch(`/api/v1/quizzes/${quiz.quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: currentSession.startTime,
          selectedAnswerIds: selectedIds,
          questionIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể nộp bài thi.");
      }

      const result: TestSubmitResult = await res.json();
      clearSession();

      if (result.takeId) {
        router.push(`/ket-qua/${result.takeId}`);
      } else {
        sessionStorage.setItem("qcl_guest_result", JSON.stringify(result));
        router.push("/ket-qua/khach");
      }
    } catch {
      alert("Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại!");
      setIsSubmitting(false);
    }
  }, [isSubmitting, currentSession, quiz, clearSession, router]);

  const handleAutoSubmit = useCallback(() => {
    alert(t("timeUp"));
    handleSubmit();
  }, [t, handleSubmit]);

  // Bộ đếm thời gian (chỉ áp dụng ở Chế độ Thi sát hạch)
  useEffect(() => {
    if (!currentSession || isPractice) return;

    const calculateRemaining = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(currentSession.startTime).getTime()) / 1000
      );
      const left = Math.max(0, currentSession.durationSeconds - elapsed);
      setRemainingSeconds(left);
      return left;
    };

    calculateRemaining();
    const interval = setInterval(() => {
      const left = calculateRemaining();
      if (left <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, isPractice, handleAutoSubmit]);

  const currentIndex = currentSession?.currentIndex ?? 0;
  const currentQuestion = quiz.questions[currentIndex] || quiz.questions[0];

  // Lắng nghe phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= "1" && e.key <= "4") {
        const optionIndex = parseInt(e.key, 10) - 1;
        if (currentQuestion && currentQuestion.answers[optionIndex]) {
          toggleAnswer(currentQuestion.id, currentQuestion.answers[optionIndex].id);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < quiz.questions.length - 1) setCurrentIndex(currentIndex + 1);
      } else if (e.key.toLowerCase() === "f") {
        if (currentQuestion) toggleFlag(currentQuestion.id);
      } else if (e.key === "Escape") {
        setShowConfirmModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, currentQuestion, quiz.questions, toggleAnswer, setCurrentIndex, toggleFlag]);

  // Toggle fullscreen
  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Format thời gian MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [remainingSeconds]);

  if (!mounted || !currentQuestion) {
    if (mounted && quiz.questions.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto gap-4 font-mono select-none">
          <div className="size-12 border border-border bg-card flex items-center justify-center text-muted-foreground">
            <BookOpen className="size-6" />
          </div>
          <h2 className="text-base font-bold text-foreground uppercase">
            {"//"} KHÔNG CÓ CÂU HỎI CHO HẠNG NÀY
          </h2>
          <p className="text-xs text-muted-foreground font-sans">
            {quiz.detail || "Chương kiến thức này không áp dụng trong chương trình đào tạo của hạng GPLX đã chọn."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>QUAY VỀ TRANG CHỦ</span>
          </button>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs font-mono text-muted-foreground">
        {"//"} KHỞI TẠO BUỒNG THI SÁT HẠCH...
      </div>
    );
  }

  const selectedAnswerId = currentSession?.selectedAnswers[currentQuestion.id];
  const isFlagged = currentSession?.flaggedQuestionIds.includes(currentQuestion.id);
  const answeredCount = Object.keys(currentSession?.selectedAnswers || {}).length;
  const isCritical = Boolean(currentQuestion.isCritical);

  return (
    <div className="flex flex-col flex-1 max-w-[1380px] mx-auto w-full px-2 sm:px-4 py-2 sm:py-3 gap-3">
      {/* Bố cục 2 Cột chuẩn Buồng Sát hạch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 items-start w-full">
        {/* ============================================================ */}
        {/* CỘT TRÁI (7/12): Nội dung câu hỏi + Strip thông tin thí sinh */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Main Question Panel */}
          <div className="border border-border bg-card p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-4">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3 flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-2 py-0.5 border border-primary/40 bg-primary/10 text-primary tabular-nums">
                    QUESTION // {String(currentIndex + 1).padStart(2, "0")} / {quiz.questions.length}
                  </span>

                  {/* Critical Hazard Alert (trong chế độ luyện tập) */}
                  {isPractice && isCritical && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-bold border border-destructive/40 bg-destructive/10 text-destructive animate-pulse">
                      <ShieldAlert className="size-3.5" />
                      <span>CRITICAL HAZARD</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold transition-colors border cursor-pointer ${
                      isFlagged
                        ? "bg-amber-500/15 text-amber-500 border-amber-500/50"
                        : "text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
                    }`}
                    title="Đánh dấu cờ (F)"
                  >
                    <Flag className="size-3 fill-current" />
                    <span>{isFlagged ? "ĐÃ ĐÁNH DẤU (F)" : "ĐÁNH DẤU (F)"}</span>
                  </button>
                </div>
              </div>

              {/* Question Statement */}
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-relaxed font-sans">
                {currentQuestion.content}
              </h2>

              {/* Answer Options */}
              <div className="flex flex-col gap-2 pt-1 font-sans">
                {currentQuestion.answers.map((answer, idx) => {
                  const isSelected = selectedAnswerId === answer.id;
                  const optionNumber = idx + 1;

                  let optionStyle =
                    "border-border/70 hover:border-primary/50 hover:bg-muted/30 text-foreground";
                  let numBadgeStyle =
                    "bg-muted/80 text-foreground border-border font-mono font-bold";

                  if (isPractice && selectedAnswerId !== undefined) {
                    const isCorrect = currentQuestion.correctAnswerId === answer.id;
                    if (isCorrect) {
                      optionStyle =
                        "bg-primary/10 border-primary text-foreground font-semibold";
                      numBadgeStyle = "bg-primary text-primary-foreground border-primary";
                    } else if (isSelected) {
                      optionStyle =
                        "bg-destructive/10 border-destructive text-destructive font-semibold";
                      numBadgeStyle = "bg-destructive text-destructive-foreground border-destructive";
                    }
                  } else if (isSelected) {
                    optionStyle =
                      "bg-primary/10 border-primary text-foreground font-semibold shadow-xs";
                    numBadgeStyle = "bg-primary text-primary-foreground border-primary";
                  }

                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => toggleAnswer(currentQuestion.id, answer.id)}
                      className={`flex items-start gap-3 p-3 text-left text-xs sm:text-sm transition-all border cursor-pointer ${optionStyle}`}
                    >
                      <span
                        className={`size-6 flex items-center justify-center text-xs shrink-0 transition-colors border ${numBadgeStyle}`}
                      >
                        {optionNumber}
                      </span>
                      <span className="leading-relaxed pt-0.5 text-foreground/90">
                        {answer.content}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Image Canvas (nếu có sa hình / biển báo) */}
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

              {/* disable explanation */}
              {/* Giải thích đáp án (chỉ ở chế độ Luyện tập khi đã chọn đáp án) */}
              {/* {isPractice && selectedAnswerId !== undefined && currentQuestion.explanation && (
                <div className="p-3 border border-border bg-background/60 flex flex-col gap-1 text-xs font-mono mt-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-[11px] uppercase">
                    <Lightbulb className="size-3.5" />
                    <span>// GIẢI THÍCH CHI TIẾT</span>
                  </div>
                  <p className="text-muted-foreground font-sans text-xs leading-relaxed pt-0.5">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )} */}
            </div>

            {/* Navigation Strip */}
            <div className="flex items-center justify-between border-t border-border/70 pt-3 mt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary hover:bg-muted/40 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>CÂU TRƯỚC</span>
              </button>

              <span className="hidden sm:inline text-[11px] text-muted-foreground">
                [1-4] CHỌN ĐÁP ÁN • [← / →] ĐỔI CÂU
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentIndex(Math.min(quiz.questions.length - 1, currentIndex + 1))
                }
                disabled={currentIndex === quiz.questions.length - 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary hover:bg-muted/40 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <span>CÂU TIẾP</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Candidate Status Telemetry Strip */}
          <CandidateCard
            quiz={quiz}
            userName={user?.fullName || user?.username}
          />
        </div>

        {/* ============================================================ */}
        {/* CỘT PHẢI (5/12): Đồng hồ + Ma trận 3 cột + Nút Nộp Bài + Phím tắt */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex flex-col gap-3 font-mono">
          {/* Top: Timer Telemetry Panel */}
          <div className="flex items-center justify-between p-3 border border-border bg-card select-none">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase">
              <Clock className="size-4 text-primary" />
              <span>THỜI GIAN THI CÒN LẠI</span>
            </div>

            <div className="flex items-center gap-2">
              <BarcodeStrip height={10} bars={[1, 2, 1, 3]} className="opacity-60 hidden sm:block" />
              <div
                className={`font-mono text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight px-2 py-0.5 border ${
                  remainingSeconds < 120
                    ? "bg-destructive/15 text-destructive border-destructive animate-pulse"
                    : "bg-background text-primary border-primary/40"
                }`}
              >
                {formattedTime}
              </div>
            </div>
          </div>

          {/* Middle: 3-Column Question Matrix with Integrated DensityBar */}
          <QuestionMatrix
            questions={quiz.questions}
            currentIndex={currentIndex}
            selectedAnswers={currentSession?.selectedAnswers || {}}
            flaggedQuestionIds={currentSession?.flaggedQuestionIds || []}
            onSelectQuestion={setCurrentIndex}
            onToggleAnswer={toggleAnswer}
            isPractice={isPractice}
          />

          {/* Action: Big Cockpit Submit Button */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 select-none shadow-xs"
          >
            <BarcodeStrip height={12} className="opacity-80" />
            <Send className="size-4" />
            <span>KẾT THÚC BÀI THI (ESC)</span>
            <BarcodeStrip height={12} className="opacity-80" />
          </button>

          {/* Quick Utility Action Buttons */}
          <div className="p-2.5 border border-border bg-card flex flex-col gap-2 text-xs select-none">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-2 py-1.5 border border-border hover:border-primary hover:bg-muted/40 text-[11px] font-bold text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>HƯỚNG DẪN</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-2 py-1.5 border border-border hover:border-primary hover:bg-muted/40 text-[11px] font-bold text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <FolderSync className="size-3 text-muted-foreground" />
                <span>ĐỔI ĐỀ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Làm lại đề thi này từ đầu?")) {
                    clearSession();
                    window.location.reload();
                  }
                }}
                className="px-2 py-1.5 border border-border hover:border-primary hover:bg-muted/40 text-[11px] font-bold text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className="size-3 text-muted-foreground" />
                <span>LÀM LẠI</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreenMode}
                className="px-2 py-1.5 border border-border hover:border-primary hover:bg-muted/40 text-[11px] font-bold text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="size-3 text-muted-foreground" />
                    <span>THU NHỎ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="size-3 text-muted-foreground" />
                    <span>TOÀN MÀN</span>
                  </>
                )}
              </button>
            </div>

            {/* 1-Line Minimalist Keyboard Legend (No noisy paragraphs!) */}
            <div className="pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground text-center">
              [1-4] ĐÁP ÁN • [← / →] ĐỔI CÂU • [F] CỜ • [ESC] NỘP BÀI
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 font-mono select-none">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm uppercase">
              <CheckCircle2 className="size-4 text-primary" />
              <span>{"//"} XÁC NHẬN NỘP BÀI THI</span>
            </div>

            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Bạn đã hoàn thành{" "}
              <strong className="text-foreground font-mono font-bold">
                {answeredCount}/{quiz.questions.length} câu
              </strong>
              . Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 border border-border text-foreground hover:bg-muted/40 transition-colors cursor-pointer font-bold"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold transition-colors cursor-pointer"
              >
                {isSubmitting ? "ĐANG NỘP..." : "NỘP BÀI NGAY"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      <ExamGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        licenseClassCode={quiz.licenseClassCode}
        passScore={quiz.passScore}
        totalQuestions={quiz.totalQuestions}
      />
    </div>
  );
}
