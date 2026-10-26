"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useExamStore } from "@/stores/use-exam-store";
import type { QuizExamDetail, TestSubmitResult } from "@/lib/api-client";
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface ExamEngineProps {
  quiz: QuizExamDetail;
}

export function ExamEngine({ quiz }: ExamEngineProps) {
  const t = useTranslations("Exam");
  const router = useRouter();

  const {
    currentSession,
    startSession,
    selectAnswer,
    toggleFlag,
    setCurrentIndex,
    clearSession,
  } = useExamStore();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(1140); // 19 phút

  // Khởi tạo hoặc khôi phục session
  useEffect(() => {
    setMounted(true);
    startSession(quiz.quizId, quiz.title);
  }, [quiz.quizId, quiz.title, startSession]);

  // Bộ đếm thời gian thực tế (Tính chênh lệch từ startTime)
  useEffect(() => {
    if (!currentSession) return;

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
  }, [currentSession]);

  // Nộp bài thi
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !currentSession) return;
    setIsSubmitting(true);

    try {
      const selectedIds = Object.values(currentSession.selectedAnswers);

      const res = await fetch(`/api/v1/quizzes/${quiz.quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: currentSession.startTime,
          selectedAnswerIds: selectedIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể nộp bài thi.");
      }

      const result: TestSubmitResult = await res.json();
      clearSession();

      if (result.takeId) {
        // Đã đăng nhập: Lưu vào DB -> chuyển sang trang kết quả lượt thi
        router.push(`/ket-qua/${result.takeId}`);
      } else {
        // Khách vãng lai: Lưu kết quả vào sessionStorage và chuyển trang
        sessionStorage.setItem("qcl_guest_result", JSON.stringify(result));
        router.push("/ket-qua/khach");
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại!");
      setIsSubmitting(false);
    }
  }, [isSubmitting, currentSession, quiz.quizId, clearSession, router]);

  const handleAutoSubmit = useCallback(() => {
    alert(t("timeUp"));
    handleSubmit();
  }, [t, handleSubmit]);

  const currentIndex = currentSession?.currentIndex ?? 0;
  const currentQuestion = quiz.questions[currentIndex] || quiz.questions[0];

  // Lắng nghe phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= "1" && e.key <= "4") {
        const optionIndex = parseInt(e.key, 10) - 1;
        if (currentQuestion && currentQuestion.answers[optionIndex]) {
          selectAnswer(currentQuestion.id, currentQuestion.answers[optionIndex].id);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        if (currentIndex < quiz.questions.length - 1) setCurrentIndex(currentIndex + 1);
      } else if (e.key.toLowerCase() === "f") {
        if (currentQuestion) toggleFlag(currentQuestion.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, currentQuestion, quiz.questions, selectAnswer, setCurrentIndex, toggleFlag]);

  // Format thời gian MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [remainingSeconds]);

  if (!mounted || !currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-muted-foreground">
        Đang chuẩn bị phòng thi...
      </div>
    );
  }

  const selectedAnswerId = currentSession?.selectedAnswers[currentQuestion.id];
  const isFlagged = currentSession?.flaggedQuestionIds.includes(currentQuestion.id);
  const answeredCount = Object.keys(currentSession?.selectedAnswers || {}).length;

  return (
    <div className="flex flex-col flex-1 max-w-6xl mx-auto px-4 py-4 w-full gap-4">
      {/* Top Header: Tên đề, Bộ đếm thời gian, Nút Nộp bài */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground line-clamp-1">{quiz.title}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            ({quiz.totalQuestions} câu hỏi)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold tabular-nums border ${
              remainingSeconds < 120
                ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse"
                : "bg-muted/60 text-foreground border-border/70"
            }`}
            aria-live="polite"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? t("submitting") : t("submitExam")}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Vùng hiển thị câu hỏi (Trái) & Bảng câu hỏi Palette (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Vùng hiển thị câu hỏi hiện tại (8/12) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-5 rounded-lg border border-border/80 bg-card">
          <div className="flex flex-col gap-4">
            {/* Header câu hỏi: Số thứ tự câu + Nút Bookmark */}
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-xs font-semibold text-primary font-mono tabular-nums">
                CÂU {currentIndex + 1} / {quiz.questions.length}
              </span>

              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                  isFlagged
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "text-muted-foreground border-border/60 hover:text-foreground"
                }`}
              >
                <Flag className="w-3 h-3" />
                <span>{isFlagged ? "Đã đánh dấu (F)" : "Đánh dấu (F)"}</span>
              </button>
            </div>

            {/* Nội dung câu hỏi */}
            <h2 className="text-base font-medium text-foreground leading-relaxed">
              {currentQuestion.content}
            </h2>

            {/* Hình ảnh biển báo / sa hình (nếu có) */}
            {currentQuestion.image && currentQuestion.image !== "none" && (
              <div className="relative w-full max-w-md h-48 sm:h-56 mx-auto my-2 rounded-md border border-border overflow-hidden bg-muted/20">
                <Image
                  src={currentQuestion.image}
                  alt={`Minh họa câu hỏi ${currentQuestion.id}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}

            {/* Danh sách các lựa chọn đáp án */}
            <div className="flex flex-col gap-2 pt-2">
              {currentQuestion.answers.map((answer, idx) => {
                const isSelected = selectedAnswerId === answer.id;
                const letter = String.fromCharCode(65 + idx); // A, B, C, D

                return (
                  <button
                    key={answer.id}
                    onClick={() => selectAnswer(currentQuestion.id, answer.id)}
                    className={`flex items-start gap-3 p-3 rounded-md text-left text-xs sm:text-sm transition-all border ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground font-medium shadow-xs"
                        : "border-border/70 hover:border-border hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border border-border/60"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="leading-relaxed pt-0.5">{answer.content}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation câu hỏi: Câu trước / Câu sau */}
          <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-6">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("previousQuestion")}</span>
            </button>

            <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
              Phím tắt: 1-4 chọn đáp án • ← / → chuyển câu
            </span>

            <button
              onClick={() =>
                setCurrentIndex(Math.min(quiz.questions.length - 1, currentIndex + 1))
              }
              disabled={currentIndex === quiz.questions.length - 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <span>{t("nextQuestion")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bảng câu hỏi Palette (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-4 p-4 rounded-lg border border-border/80 bg-card h-fit">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-bold text-foreground">{t("questionPalette")}</span>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {answeredCount}/{quiz.questions.length} đã làm
            </span>
          </div>

          {/* Grid các số câu hỏi */}
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
            {quiz.questions.map((q, idx) => {
              const isAns = currentSession?.selectedAnswers[q.id] !== undefined;
              const isFlag = currentSession?.flaggedQuestionIds.includes(q.id);
              const isCur = idx === currentIndex;

              let btnStyle = "border-border/70 hover:bg-muted/70 text-muted-foreground";
              if (isCur) {
                btnStyle = "ring-2 ring-foreground text-foreground font-bold border-foreground";
              } else if (isAns) {
                btnStyle = "bg-primary/15 border-primary/40 text-primary font-medium";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-8 rounded text-xs font-mono tabular-nums flex items-center justify-center border transition-all ${btnStyle}`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Chú giải trạng thái */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-primary/20 border border-primary/50" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs border border-border" />
              <span>Chưa làm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Đánh dấu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xác nhận nộp bài */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{t("confirmSubmitTitle")}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("confirmSubmitDesc", {
                answered: answeredCount,
                total: quiz.questions.length,
              })}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                {isSubmitting ? t("submitting") : t("submitExam")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
