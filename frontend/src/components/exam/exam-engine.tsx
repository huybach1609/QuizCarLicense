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
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  Lightbulb,
  Maximize2,
  Minimize2,
  RefreshCw,
  HelpCircle,
  FolderSync,
} from "lucide-react";
import { CandidateCard } from "./candidate-card";
import { QuestionMatrix } from "./question-matrix";
import { ExamGuideModal } from "./exam-guide-modal";

interface ExamEngineProps {
  quiz: QuizExamDetail;
}

interface UserProfile {
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

export function ExamEngine({ quiz }: ExamEngineProps) {
  const t = useTranslations("Exam");
  const router = useRouter();

  const isPractice = Boolean(quiz.isPracticeMode);
  const examDurationMinutes = quiz.durationMinutes ?? (quiz.totalQuestions === 25 ? 19 : 20);

  const {
    currentSession,
    startSession,
    selectAnswer,
    toggleAnswer,
    toggleFlag,
    setCurrentIndex,
    clearSession,
  } = useExamStore();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    examDurationMinutes * 60
  );

  // Lấy thông tin thí sinh nếu đã đăng nhập
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Khởi tạo hoặc khôi phục session
  useEffect(() => {
    setMounted(true);
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
        // Đã đăng nhập: Chuyển sang trang kết quả lượt thi có TakeId
        router.push(`/ket-qua/${result.takeId}`);
      } else {
        // Khách vãng lai: Lưu kết quả vào sessionStorage
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

  // Lắng nghe phím tắt bàn phím chuẩn phòng thi sát hạch
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

  // Toggle chế độ toàn màn hình
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-lg mx-auto gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Không có câu hỏi ôn tập cho hạng này
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {quiz.detail || "Chương kiến thức này không áp dụng trong chương trình đào tạo và sát hạch của hạng GPLX đã chọn."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về trang chủ</span>
          </button>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-muted-foreground">
        Đang khởi tạo phòng thi sát hạch...
      </div>
    );
  }

  const selectedAnswerId = currentSession?.selectedAnswers[currentQuestion.id];
  const isFlagged = currentSession?.flaggedQuestionIds.includes(currentQuestion.id);
  const answeredCount = Object.keys(currentSession?.selectedAnswers || {}).length;
  const progressPercent = Math.round((answeredCount / quiz.questions.length) * 100);

  return (
    <div className="flex flex-col flex-1 max-w-[1380px] mx-auto w-full px-2 sm:px-4 py-2 sm:py-3 gap-3">
      {/* Khung chính phòng thi: Bố cục 2 cột chuẩn Phần mềm Sát hạch Bộ GTVT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 items-start w-full">
        {/* ============================================================ */}
        {/* CỘT TRÁI (7/12): Câu hỏi, Đáp án, Ảnh/Hướng dẫn, Tiến độ, Thí sinh */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-7 flex flex-col gap-3">
          {/* Box 1: Khung Nội dung Câu hỏi & Các lựa chọn */}
          <div className="flex flex-col justify-between p-4 sm:p-5 rounded-lg border border-border/80 bg-card">
            <div className="flex flex-col gap-4">
              {/* Header câu hỏi: Số thứ tự + Cảnh báo Điểm liệt + Nút cờ Flag */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono tracking-wide px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    CÂU {currentIndex + 1} / {quiz.questions.length}
                  </span>

                  {/* Badge Câu điểm liệt (hiển thị khi ở chế độ ôn tập) */}
                  {isPractice && currentQuestion.isCritical && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>CÂU ĐIỂM LIỆT</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors border cursor-pointer ${
                      isFlagged
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                        : "text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted/50"
                    }`}
                    title="Đánh dấu câu hỏi cần xem lại (Phím F)"
                  >
                    <Flag className="w-3.5 h-3.5 fill-current" />
                    <span>{isFlagged ? "Đã đánh dấu (F)" : "Đánh dấu (F)"}</span>
                  </button>
                </div>
              </div>

              {/* Tiêu đề câu hỏi */}
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                {currentQuestion.content}
              </h2>

              {/* Danh sách lựa chọn đáp án: 1-, 2-, 3-, 4- */}
              <div className="flex flex-col gap-2 pt-1">
                {currentQuestion.answers.map((answer, idx) => {
                  const isSelected = selectedAnswerId === answer.id;
                  const optionNumber = idx + 1;

                  // Trạng thái kiểu dáng theo Design System của web
                  let optionStyle =
                    "border-border/70 hover:border-primary/50 hover:bg-muted/40 text-foreground";
                  let numBadgeStyle =
                    "bg-muted text-foreground border border-border/70 font-mono";

                  if (isPractice && selectedAnswerId !== undefined) {
                    const isCorrect = currentQuestion.correctAnswerId === answer.id;
                    if (isCorrect) {
                      optionStyle =
                        "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-semibold";
                      numBadgeStyle = "bg-emerald-600 text-white border-emerald-600";
                    } else if (isSelected) {
                      optionStyle =
                        "bg-destructive/10 border-destructive text-destructive font-semibold";
                      numBadgeStyle = "bg-destructive text-white border-destructive";
                    }
                  } else if (isSelected) {
                    optionStyle =
                      "bg-primary/10 border-primary text-foreground font-semibold shadow-2xs";
                    numBadgeStyle = "bg-primary text-primary-foreground border-primary";
                  }

                  return (
                    <button
                      key={answer.id}
                      onClick={() => toggleAnswer(currentQuestion.id, answer.id)}
                      className={`flex items-start gap-3 p-3 rounded-md text-left text-xs sm:text-sm transition-all border cursor-pointer ${optionStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${numBadgeStyle}`}
                      >
                        {optionNumber}
                      </span>
                      <span className="leading-relaxed pt-0.5">
                        <strong className="mr-1">{optionNumber}-</strong> {answer.content}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Giải thích đáp án (chỉ hiện ở chế độ Ôn tập) */}
              {isPractice && selectedAnswerId !== undefined && (
                <div className="p-3.5 rounded-md bg-muted/50 border border-border/80 flex flex-col gap-1 text-xs mt-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>
                      {selectedAnswerId === currentQuestion.correctAnswerId
                        ? "Chính xác!"
                        : "Chưa chính xác!"}
                    </span>
                  </div>
                  {currentQuestion.explanation && (
                    <p className="text-muted-foreground leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Vùng Minh họa: Chỉ hiển thị khi câu hỏi có hình ảnh sa hình / biển báo */}
              {currentQuestion.image && currentQuestion.image !== "none" && (
                <div className="relative w-full max-w-md mx-auto my-2 rounded-md border border-border overflow-hidden bg-muted/20 flex items-center justify-center p-2 min-h-[160px]">
                  <img
                    src={currentQuestion.image}
                    alt={`Minh họa câu hỏi ${currentQuestion.id}`}
                    className="max-h-56 sm:max-h-64 max-w-full object-contain"
                    loading="eager"
                  />
                </div>
              )}
            </div>

            {/* Điều hướng chuyển câu Trước / Sau */}
            <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-4">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("previousQuestion")}</span>
              </button>

      

              <button
                onClick={() =>
                  setCurrentIndex(Math.min(quiz.questions.length - 1, currentIndex + 1))
                }
                disabled={currentIndex === quiz.questions.length - 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span>{t("nextQuestion")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Box 2: Thanh tiến độ hoàn thành % (Progress Bar) */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/80 bg-card">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Tiến độ bài làm:</span>
            <div className="relative flex-1 h-5 rounded bg-muted/60 overflow-hidden border border-border/50">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-foreground drop-shadow-xs tabular-nums">
                {progressPercent}% ({answeredCount}/{quiz.questions.length} câu)
              </span>
            </div>
          </div>

          {/* Box 3: Khung Thông tin Thí sinh & Nhóm hỗ trợ */}
          <CandidateCard
            quiz={quiz}
            userName={user?.fullName || user?.username}
          />
        </div>

        {/* ============================================================ */}
        {/* CỘT PHẢI (5/12): Đồng hồ, Bảng danh sách câu hỏi, Nút Kết thúc, Hướng dẫn */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-5 flex flex-col gap-3">
          {/* Top: Hộp Đồng hồ đếm ngược (Timer Box) */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-primary/30 bg-card shadow-2xs">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Thời gian thi còn lại:</span>
            </div>

            <div
              className={`font-mono text-xl sm:text-2xl font-bold tabular-nums tracking-tight px-2.5 py-0.5 rounded ${
                remainingSeconds < 120
                  ? "bg-destructive/15 text-destructive animate-pulse"
                  : "text-foreground"
              }`}
            >
              {formattedTime}
            </div>
          </div>

          {/* Middle: Bảng Ma trận câu hỏi (1-15, 16-30, 31-35) */}
          <QuestionMatrix
            questions={quiz.questions}
            currentIndex={currentIndex}
            selectedAnswers={currentSession?.selectedAnswers || {}}
            flaggedQuestionIds={currentSession?.flaggedQuestionIds || []}
            onSelectQuestion={setCurrentIndex}
            onToggleAnswer={toggleAnswer}
            isPractice={isPractice}
          />

          {/* Action: Nút KẾT THÚC to nổi bật */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>KẾT THÚC</span>
          </button>

          {/* Bottom: Hướng dẫn nhanh & Thao tác phụ */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-card flex flex-col gap-3 text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>Hướng dẫn nhanh:</span>
            </div>

            <ul className="flex flex-col gap-1.5 text-muted-foreground text-[11px]">
              <li>• Di chuyển câu dùng phím mũi tên (← ↑ ↓ →) hoặc dùng chuột trái.</li>
              <li>• Chọn đáp án nhanh bằng phím số (1, 2, 3, 4) trên bàn phím.</li>
              <li>• Kết thúc bài thi nhấn phím ESC hoặc bấm nút KẾT THÚC.</li>
            </ul>

            {/* Quick action utility buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-2 py-1.5 rounded border border-border hover:bg-muted text-[11px] font-medium text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Hướng dẫn thao tác</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-2 py-1.5 rounded border border-border hover:bg-muted text-[11px] font-medium text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <FolderSync className="w-3 h-3 text-muted-foreground" />
                <span>Đổi đề / hạng khác</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Bạn có muốn làm lại đề thi này từ đầu không?")) {
                    clearSession();
                    window.location.reload();
                  }
                }}
                className="px-2 py-1.5 rounded border border-border hover:bg-muted text-[11px] font-medium text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-muted-foreground" />
                <span>Làm lại từ đầu</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreenMode}
                className="px-2 py-1.5 rounded border border-border hover:bg-muted text-[11px] font-medium text-foreground transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-muted-foreground" />
                    <span>Thu nhỏ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 text-muted-foreground" />
                    <span>Toàn màn hình</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xác nhận nộp bài (ESC hoặc bấm KẾT THÚC) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full p-5 shadow-xl flex flex-col gap-4">
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isSubmitting ? t("submitting") : "Xác nhận nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hướng dẫn thao tác chi tiết */}
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
