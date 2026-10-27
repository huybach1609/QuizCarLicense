"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import type { TestSubmitResult } from "@/lib/api-client";
import { ExamResultStation, type ExamResultData } from "@/components/exam/exam-result-station";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function GuestResultPage() {
  const [result, setResult] = useState<TestSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("qcl_guest_result");
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch {
        // Parse error
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs font-mono text-muted-foreground">
        // ĐANG TẢI KẾT QUẢ THI THỬ...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center max-w-md mx-auto font-mono select-none">
        <div className="size-12 border border-border bg-card flex items-center justify-center text-muted-foreground">
          <BookOpen className="size-6" />
        </div>
        <h2 className="text-base font-bold text-foreground uppercase">
          // KHÔNG TÌM THẤY KẾT QUẢ
        </h2>
        <p className="text-xs text-muted-foreground font-sans">
          Không tìm thấy dữ liệu bài thi thử vừa làm trong phiên làm việc này. Bạn có thể chọn đề thi khác để bắt đầu.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>QUAY VỀ BỘ ĐỀ</span>
        </Link>
      </div>
    );
  }

  const resultData: ExamResultData = {
    takeId: result.takeId,
    quizId: result.quizId,
    quizTitle: result.quizTitle || "Bài thi sát hạch lý thuyết",
    score: result.score ?? 0,
    totalQuestions: result.totalQuestions ?? (result.questions?.length || 30),
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    passScore: result.passScore,
    isPassed: result.isPassed,
    hasCriticalError: result.hasCriticalError,
    licenseClassCode: result.licenseClassCode || "B",
    isGuest: true,
    questions: result.questions || [],
  };

  return <ExamResultStation data={resultData} />;
}
