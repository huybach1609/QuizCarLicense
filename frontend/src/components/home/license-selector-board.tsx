"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import type { LicenseClass, QuizSummary } from "@/lib/api-client";
import {
  Clock,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Shuffle,
  BookOpen,
  Flame,
  ShieldAlert,
  Car,
  Bike,
} from "lucide-react";

interface LicenseSelectorBoardProps {
  licenses: LicenseClass[];
  quizzes: QuizSummary[];
}

const FALLBACK_LICENSES: LicenseClass[] = [
  { licenseClassId: 1, code: "A1", name: "Hạng A1", vehicleGroup: "Motorbike", totalQuestions: 40, durationMinutes: 27, passScore: 36, displayOrder: 1, examSetCount: 6, description: "Xe mô tô hai bánh có dung tích xi-lanh đến 125 cm³ hoặc công suất động cơ điện đến 11 kW." },
  { licenseClassId: 2, code: "A", name: "Hạng A", vehicleGroup: "Motorbike", totalQuestions: 40, durationMinutes: 27, passScore: 36, displayOrder: 2, examSetCount: 6, description: "Xe mô tô hai bánh có dung tích xi-lanh trên 125 cm³ hoặc công suất động cơ điện trên 11 kW." },
  { licenseClassId: 3, code: "B", name: "Hạng B", vehicleGroup: "Car", totalQuestions: 30, durationMinutes: 20, passScore: 27, displayOrder: 3, examSetCount: 6, description: "Ô tô chở người đến 08 chỗ; xe ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế đến 3.500 kg." },
  { licenseClassId: 4, code: "C1", name: "Hạng C1", vehicleGroup: "Car", totalQuestions: 35, durationMinutes: 22, passScore: 32, displayOrder: 4, examSetCount: 6, description: "Ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế trên 3.500 kg đến 7.500 kg." },
  { licenseClassId: 5, code: "C", name: "Hạng C", vehicleGroup: "Car", totalQuestions: 40, durationMinutes: 24, passScore: 36, displayOrder: 5, examSetCount: 6, description: "Ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ theo thiết kế trên 7.500 kg." },
  { licenseClassId: 6, code: "D1", name: "Hạng D1", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 6, examSetCount: 6, description: "Ô tô chở người trên 08 chỗ đến 16 chỗ (không kể chỗ của người lái xe)." },
  { licenseClassId: 7, code: "D2", name: "Hạng D2", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 7, examSetCount: 6, description: "Ô tô chở người (kể cả xe buýt) trên 16 chỗ đến 29 chỗ." },
  { licenseClassId: 8, code: "D", name: "Hạng D", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 8, examSetCount: 6, description: "Ô tô chở người (kể cả xe buýt) trên 29 chỗ; xe ô tô chở người giường nằm." },
  { licenseClassId: 9, code: "BE", name: "Hạng BE", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 9, examSetCount: 6, description: "Xe ô tô hạng B kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg." },
  { licenseClassId: 10, code: "C1E", name: "Hạng C1E", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 10, examSetCount: 6, description: "Xe ô tô hạng C1 kéo rơ moóc có khối lượng toàn bộ theo thiết kế trên 750 kg." },
  { licenseClassId: 11, code: "CE", name: "Hạng CE", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 11, examSetCount: 6, description: "Xe ô tô hạng C kéo rơ moóc trên 750 kg; xe ô tô đầu kéo kéo sơ mi rơ moóc." },
];

export function LicenseSelectorBoard({
  licenses,
  quizzes,
}: LicenseSelectorBoardProps) {
  const licenseList = licenses.length > 0 ? licenses : FALLBACK_LICENSES;
  const [selectedCode, setSelectedCode] = useState<string>("B");

  const activeLicense = useMemo(
    () =>
      licenseList.find((l) => l.code === selectedCode) ||
      licenseList.find((l) => l.code === "B") ||
      licenseList[0],
    [licenseList, selectedCode]
  );

  // Bộ đề sát hạch cố định của hạng đang chọn
  const officialExams = useMemo(
    () =>
      quizzes
        .filter(
          (q) =>
            q.licenseClassCode === activeLicense?.code &&
            q.quizType === "OfficialExam"
        )
        .sort((a, b) => (a.examNumber ?? 99) - (b.examNumber ?? 99)),
    [quizzes, activeLicense]
  );

  // Đề thi ngẫu nhiên đại diện của hạng đang chọn
  const randomTemplateQuiz = useMemo(
    () =>
      quizzes.find(
        (q) =>
          q.licenseClassCode === activeLicense?.code &&
          q.quizType === "RandomTemplate"
      ),
    [quizzes, activeLicense]
  );

  // Các bộ đề ôn tập theo chương & chủ đề đặc biệt
  const specialPracticeQuizzes = useMemo(
    () =>
      quizzes.filter(
        (q) =>
          q.quizType === "CriticalPractice" || q.quizType === "FrequentMistakes"
      ),
    [quizzes]
  );

  const chapterPracticeQuizzes = useMemo(
    () =>
      quizzes
        .filter((q) => q.quizType === "ChapterPractice")
        .sort((a, b) => (a.examNumber ?? 99) - (b.examNumber ?? 99)),
    [quizzes]
  );

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Thanh chọn 11 Hạng Giấy Phép Lái Xe độc lập */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Chọn Hạng Giấy Phép Lái Xe (Thông tư 108/2026/TT-BCA)
          </h2>
          <span className="text-xs text-muted-foreground">
            11 hạng sát hạch độc lập
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
          {licenseList.map((lic) => {
            const isSelected = lic.code === activeLicense?.code;
            const isMoto = lic.vehicleGroup === "Motorbike";
            return (
              <button
                key={lic.code}
                type="button"
                onClick={() => setSelectedCode(lic.code)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-card text-foreground border-border/80 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-1">
                  {isMoto ? (
                    <Bike className="w-3.5 h-3.5 opacity-80" />
                  ) : (
                    <Car className="w-3.5 h-3.5 opacity-80" />
                  )}
                  <span className="text-sm font-bold tracking-tight">
                    {lic.code}
                  </span>
                </div>
                <span
                  className={`text-[10px] tabular-nums mt-0.5 ${
                    isSelected
                      ? "text-primary-foreground/90"
                      : "text-muted-foreground"
                  }`}
                >
                  {lic.totalQuestions}c / {lic.durationMinutes}p
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Bảng Thông Số Quy Chuẩn Của Hạng Đang Chọn & Nút Thi Ngẫu Nhiên */}
      {activeLicense && (
        <div className="p-5 sm:p-6 rounded-lg border border-border bg-card flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                {activeLicense.name}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {activeLicense.vehicleGroup === "Motorbike"
                  ? "Nhóm Mô tô - Xe máy"
                  : "Nhóm Ô tô - Vận tải"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {activeLicense.description}
            </p>

            {/* 4 Chỉ số điều kiện đạt chuẩn sát hạch */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-md bg-muted/50 border border-border/60 flex flex-col">
                <span className="text-[11px] text-muted-foreground">
                  Số lượng câu hỏi
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {activeLicense.totalQuestions} câu trắc nghiệm
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-muted/50 border border-border/60 flex flex-col">
                <span className="text-[11px] text-muted-foreground">
                  Thời gian làm bài
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {activeLicense.durationMinutes} phút
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-muted/50 border border-border/60 flex flex-col">
                <span className="text-[11px] text-muted-foreground">
                  Điểm đạt tối thiểu
                </span>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {activeLicense.passScore}/{activeLicense.totalQuestions} điểm
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-destructive/5 border border-destructive/20 flex flex-col">
                <span className="text-[11px] text-destructive font-medium">
                  Điều kiện bắt buộc
                </span>
                <span className="text-xs font-bold text-destructive">
                  Không sai câu điểm liệt
                </span>
              </div>
            </div>
          </div>

          {/* Nút Thi Đề Ngẫu Nhiên */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {randomTemplateQuiz ? (
              <Link
                href={`/thi-sat-hach/${randomTemplateQuiz.quizId}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Shuffle className="w-4 h-4" />
                <span>Thi Đề Ngẫu Nhiên ({activeLicense.name})</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-muted text-muted-foreground text-xs font-medium"
              >
                <Shuffle className="w-4 h-4" />
                <span>Đang khởi tạo ma trận đề...</span>
              </button>
            )}
            <span className="text-[11px] text-muted-foreground text-center">
              Rút tự động {activeLicense.totalQuestions} câu theo ma trận chuẩn
            </span>
          </div>
        </div>
      )}

      {/* 3. Danh sách Bộ đề sát hạch cố định của hạng đang chọn */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Bộ Đề Sát Hạch Cố Định — {activeLicense?.name}
            </h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              ({officialExams.length} bộ đề)
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Chế độ Thi thử: Đếm ngược {activeLicense?.durationMinutes} phút
          </span>
        </div>

        {officialExams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {officialExams.map((quiz) => (
              <div
                key={quiz.quizId}
                className="group p-4 rounded-lg border border-border/80 bg-card hover:border-primary/50 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground tabular-nums">
                      <HelpCircle className="w-3.5 h-3.5 text-primary" />
                      <span>{quiz.totalQuestions} câu</span>
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {quiz.durationMinutes ?? activeLicense?.durationMinutes}p
                      </span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono tabular-nums">
                      Đạt{" "}
                      {quiz.passScore ?? activeLicense?.passScore}/
                      {quiz.totalQuestions}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {quiz.title}
                  </h4>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {quiz.detail}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Đề chuẩn #{quiz.examNumber ?? quiz.quizId}
                  </span>
                  <Link
                    href={`/thi-sat-hach/${quiz.quizId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <span>Vào phòng thi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
            Chưa có bộ đề cố định cho hạng này. Hãy khởi động lại Backend để tự
            động nạp bộ đề chuẩn.
          </div>
        )}
      </div>

      {/* 4. Khu vực Ôn tập theo Chương & Bộ Câu Hỏi Điểm Liệt (Chế độ Practice) */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Ôn Tập Theo Chương & Chủ Đề Trọng Tâm (Chấm Đáp Án Tức Thì)
            </h3>
          </div>
          <span className="text-xs text-primary font-medium hidden sm:inline">
            Chọn đáp án hiện Đúng/Sai & Giải thích ngay
          </span>
        </div>

        {/* 2 Bộ đề đặc biệt: 60 Câu Điểm Liệt & 50 Câu Hay Sai */}
        {specialPracticeQuizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {specialPracticeQuizzes.map((quiz) => {
              const isCriticalQuiz = quiz.quizType === "CriticalPractice";
              return (
                <div
                  key={quiz.quizId}
                  className={`p-4 rounded-lg border flex flex-col justify-between gap-3 ${
                    isCriticalQuiz
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                          isCriticalQuiz ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {isCriticalQuiz ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <Flame className="w-4 h-4" />
                        )}
                        <span>
                          {isCriticalQuiz
                            ? "Bắt buộc học kỹ (60 Câu Điểm Liệt)"
                            : "Tổng hợp hay nhầm lẫn"}
                        </span>
                      </span>
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {quiz.totalQuestions} câu hỏi
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {quiz.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {quiz.detail}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-muted-foreground">
                      Chế độ Ôn tập: Xem đáp án ngay
                    </span>
                    <Link
                      href={`/thi-sat-hach/${quiz.quizId}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isCriticalQuiz
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      <span>Ôn tập ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6 Chương kiến thức chuẩn Bộ Công An */}
        {chapterPracticeQuizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {chapterPracticeQuizzes.map((quiz) => (
              <div
                key={quiz.quizId}
                className="p-4 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground">
                      Chương {quiz.examNumber}
                    </span>
                    <span className="tabular-nums font-medium">
                      {quiz.totalQuestions} câu hỏi
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                    {quiz.title}
                  </h4>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {quiz.detail}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-primary font-medium">
                    Hiện đáp án tức thì
                  </span>
                  <Link
                    href={`/thi-sat-hach/${quiz.quizId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    <span>Luyện chương này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Ghi chú Quy định mới */}
      <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-destructive">
            Quy định sát hạch lý thuyết áp dụng từ 01/07/2026 (Thông tư 108/2026/TT-BCA):
          </span>
          <span className="text-muted-foreground leading-relaxed">
            Mỗi đề thi sát hạch đều chứa câu hỏi tình huống mất an toàn giao
            thông nghiêm trọng (Câu điểm liệt). Nếu thí sinh chọn sai câu điểm
            liệt, bài thi sẽ bị tính là <strong>KHÔNG ĐẠT</strong> ngay lập tức
            dù tổng điểm đủ chuẩn. Thí sinh bắt buộc phải vượt qua phần thi lý
            thuyết mới được dự thi phần thực hành.
          </span>
        </div>
      </div>
    </div>
  );
}
