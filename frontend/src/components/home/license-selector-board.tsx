"use client";

import { useState, useMemo } from "react";
import type { LicenseClass, QuizSummary, PracticeLicenseSummary } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, CheckCircle2, ShieldAlert } from "lucide-react";
import { CockpitHeroConsole } from "./cockpit-hero-console";
import { LicenseClassStrip } from "./license-class-strip";
import { LicenseTelemetryHud } from "./license-telemetry-hud";
import { PracticeTelemetryPanel } from "./practice-telemetry-panel";
import { ExamMatrixGrid } from "./exam-matrix-grid";

interface LicenseSelectorBoardProps {
  licenses: LicenseClass[];
  quizzes: QuizSummary[];
  practiceMatrix?: Record<string, PracticeLicenseSummary>;
}

const CHAPTER_TITLES: Record<number, string> = {
  1: "Quy định chung & Quy tắc giao thông đường bộ",
  2: "Văn hóa giao thông, đạo đức người lái xe & Kỹ năng sơ cứu",
  3: "Kỹ thuật lái xe ô tô an toàn",
  4: "Cấu tạo & Sửa chữa xe ô tô thông thường",
  5: "Hệ thống biển báo hiệu đường bộ Việt Nam",
  6: "Giải các thế sa hình & Xử lý tình huống giao thông",
};

const MOTORBIKE_FALLBACK_PRACTICE = {
  totalQuestions: 250,
  criticalCount: 53,
  frequentMistakesCount: 32,
  chapters: {
    1: { totalQuestions: 100, isApplicable: true },
    2: { totalQuestions: 10, isApplicable: true },
    3: { totalQuestions: 15, isApplicable: true },
    4: { totalQuestions: 0, isApplicable: false },
    5: { totalQuestions: 90, isApplicable: true },
    6: { totalQuestions: 35, isApplicable: true },
  } as Record<number, { totalQuestions: number; isApplicable: boolean }>,
};

const CAR_FALLBACK_PRACTICE = {
  totalQuestions: 600,
  criticalCount: 60,
  frequentMistakesCount: 50,
  chapters: {
    1: { totalQuestions: 180, isApplicable: true },
    2: { totalQuestions: 25, isApplicable: true },
    3: { totalQuestions: 58, isApplicable: true },
    4: { totalQuestions: 37, isApplicable: true },
    5: { totalQuestions: 185, isApplicable: true },
    6: { totalQuestions: 115, isApplicable: true },
  } as Record<number, { totalQuestions: number; isApplicable: boolean }>,
};

const FALLBACK_LICENSES: LicenseClass[] = [
  { licenseClassId: 1, code: "A1", name: "Hạng A1", vehicleGroup: "Motorbike", totalQuestions: 40, durationMinutes: 27, passScore: 36, displayOrder: 1, examSetCount: 6, description: "Mô tô hai bánh dung tích xi-lanh đến 125 cm³ hoặc công suất điện đến 11 kW." },
  { licenseClassId: 2, code: "A", name: "Hạng A", vehicleGroup: "Motorbike", totalQuestions: 40, durationMinutes: 27, passScore: 36, displayOrder: 2, examSetCount: 6, description: "Mô tô hai bánh dung tích xi-lanh trên 125 cm³ hoặc công suất điện trên 11 kW." },
  { licenseClassId: 3, code: "B", name: "Hạng B", vehicleGroup: "Car", totalQuestions: 30, durationMinutes: 20, passScore: 27, displayOrder: 3, examSetCount: 6, description: "Ô tô chở người đến 08 chỗ; xe ô tô tải có khối lượng toàn bộ dưới 3.500 kg." },
  { licenseClassId: 4, code: "C1", name: "Hạng C1", vehicleGroup: "Car", totalQuestions: 35, durationMinutes: 22, passScore: 32, displayOrder: 4, examSetCount: 6, description: "Ô tô tải và ô tô chuyên dùng có khối lượng từ 3.500 kg đến 7.500 kg." },
  { licenseClassId: 5, code: "C", name: "Hạng C", vehicleGroup: "Car", totalQuestions: 40, durationMinutes: 24, passScore: 36, displayOrder: 5, examSetCount: 6, description: "Ô tô tải và ô tô chuyên dùng có khối lượng toàn bộ trên 7.500 kg." },
  { licenseClassId: 6, code: "D1", name: "Hạng D1", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 6, examSetCount: 6, description: "Ô tô chở người trên 08 chỗ đến 16 chỗ ngồi (không kể lái xe)." },
  { licenseClassId: 7, code: "D2", name: "Hạng D2", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 7, examSetCount: 6, description: "Ô tô chở người (kể cả xe buýt) trên 16 chỗ đến 29 chỗ ngồi." },
  { licenseClassId: 8, code: "D", name: "Hạng D", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 8, examSetCount: 6, description: "Ô tô chở người trên 29 chỗ ngồi; xe ô tô chở người giường nằm." },
  { licenseClassId: 9, code: "BE", name: "Hạng BE", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 9, examSetCount: 6, description: "Xe ô tô hạng B kéo rơ moóc có khối lượng thiết kế trên 750 kg." },
  { licenseClassId: 10, code: "C1E", name: "Hạng C1E", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 10, examSetCount: 6, description: "Xe ô tô hạng C1 kéo rơ moóc có khối lượng thiết kế trên 750 kg." },
  { licenseClassId: 11, code: "CE", name: "Hạng CE", vehicleGroup: "Car", totalQuestions: 45, durationMinutes: 26, passScore: 41, displayOrder: 11, examSetCount: 6, description: "Xe ô tô hạng C kéo rơ moóc; xe ô tô đầu kéo kéo sơ mi rơ moóc." },
];

export function LicenseSelectorBoard({
  licenses,
  quizzes,
  practiceMatrix,
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

  // Thống kê ôn tập động theo Hạng GPLX được chọn
  const currentPractice = useMemo(() => {
    if (activeLicense && practiceMatrix && practiceMatrix[activeLicense.code]) {
      return practiceMatrix[activeLicense.code];
    }
    const isMoto = activeLicense?.vehicleGroup === "Motorbike";
    const fb = isMoto ? MOTORBIKE_FALLBACK_PRACTICE : CAR_FALLBACK_PRACTICE;
    return {
      licenseCode: activeLicense?.code ?? "B",
      licenseName: activeLicense?.name ?? "Hạng B",
      totalQuestions: fb.totalQuestions,
      criticalQuizId: 0,
      criticalCount: fb.criticalCount,
      frequentMistakesQuizId: 0,
      frequentMistakesCount: fb.frequentMistakesCount,
      chapters: Object.entries(fb.chapters).map(([examNum, info]) => ({
        quizId: 0,
        examNumber: Number(examNum),
        categoryCode: `CH${examNum}`,
        title: "",
        detail: "",
        totalQuestions: info.totalQuestions,
        isApplicable: info.isApplicable,
      })),
    };
  }, [activeLicense, practiceMatrix]);

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
  [quizzes, activeLicense]);

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

  // 2 đề đặc biệt: Điểm liệt & Hay sai
  const criticalQuiz = useMemo(
    () => quizzes.find((q) => q.quizType === "CriticalPractice"),
    [quizzes]
  );

  const frequentMistakesQuiz = useMemo(
    () => quizzes.find((q) => q.quizType === "FrequentMistakes"),
    [quizzes]
  );

  // 6 chương chuẩn
  const chapterPracticeQuizzes = useMemo(() => {
    const map = new Map<number, QuizSummary>();
    for (const q of quizzes) {
      if (q.quizType === "ChapterPractice" && q.examNumber) {
        if (!map.has(q.examNumber)) {
          map.set(q.examNumber, q);
        }
      }
    }

    if (currentPractice?.chapters) {
      for (const ch of currentPractice.chapters) {
        if (!map.has(ch.examNumber)) {
          map.set(ch.examNumber, {
            quizId: ch.quizId,
            title: ch.title || `Chương ${ch.examNumber}`,
            detail: ch.detail || "",
            totalQuestions: ch.totalQuestions,
            updatedAt: null,
            quizType: "ChapterPractice",
            examNumber: ch.examNumber,
            isPracticeMode: true,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.examNumber ?? 99) - (b.examNumber ?? 99));
  }, [quizzes, currentPractice]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Cockpit Hero Console (Split-View Telemetry & Radar) */}
      <CockpitHeroConsole
        activeLicense={activeLicense}
        randomTemplateQuiz={randomTemplateQuiz}
      />

      {/* 2. 11-Class Interlocking Console Selector Strip */}
      <LicenseClassStrip
        licenses={licenseList}
        selectedCode={selectedCode}
        onSelect={setSelectedCode}
      />

      {/* 3. 4-Instrument Telemetry Spec Readout */}
      <LicenseTelemetryHud activeLicense={activeLicense} />

      {/* 4. Telemetry Modules Tabs: 1. Ôn Tập Theo Chương & Điểm Liệt | 2. Bộ Đề Sát Hạch */}
      <Tabs defaultValue="practice" className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/80 pb-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 h-10 p-1 bg-card rounded-none border border-border">
            <TabsTrigger
              value="practice"
              className="gap-2 px-4 text-xs font-mono font-bold uppercase rounded-none data-active:bg-primary data-active:text-primary-foreground transition-all cursor-pointer"
            >
              <BookOpen className="size-3.5" />
              <span>Chương & Điểm liệt</span>
            </TabsTrigger>
            <TabsTrigger
              value="exams"
              className="gap-2 px-4 text-xs font-mono font-bold uppercase rounded-none data-active:bg-primary data-active:text-primary-foreground transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Bộ Đề Sát Hạch ({officialExams.length})</span>
            </TabsTrigger>
          </TabsList>

          <span className="text-xs font-mono text-muted-foreground hidden md:inline">
            // TELEMETRY VIEW: <strong className="text-foreground">{activeLicense.name}</strong>
          </span>
        </div>

        {/* Tab 1: Ôn Tập Theo Chương & Điểm Liệt */}
        <TabsContent value="practice" className="outline-none">
          <PracticeTelemetryPanel
            activeLicense={activeLicense}
            currentPractice={currentPractice}
            criticalQuiz={criticalQuiz}
            frequentMistakesQuiz={frequentMistakesQuiz}
            chapterPracticeQuizzes={chapterPracticeQuizzes}
            chapterTitles={CHAPTER_TITLES}
          />
        </TabsContent>

        {/* Tab 2: Lưới Ma Trận 20 Đề Thi Sát Hạch Cố Định */}
        <TabsContent value="exams" className="outline-none">
          <ExamMatrixGrid
            officialExams={officialExams}
            activeLicense={activeLicense}
          />
        </TabsContent>
      </Tabs>

      {/* 5. Regulation Footnote */}
      <div className="p-3 border border-destructive/30 bg-destructive/5 flex items-center gap-3 text-xs font-mono select-none">
        <ShieldAlert className="size-4 text-destructive shrink-0" />
        <span className="text-muted-foreground">
          <strong className="text-destructive font-bold">THÔNG TƯ 108/2026/TT-BCA:</strong>{" "}
          Mọi đề thi đều chứa câu điểm liệt. Trả lời sai câu điểm liệt bị đánh giá <strong className="text-destructive font-bold">KHÔNG ĐẠT</strong> ngay lập tức dù đạt tổng điểm quy định.
        </span>
      </div>
    </div>
  );
}
