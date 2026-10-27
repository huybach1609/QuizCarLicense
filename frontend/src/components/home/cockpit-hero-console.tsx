"use client";

import { Link } from "@/i18n/routing";
import type { LicenseClass, QuizSummary } from "@/lib/api-client";
import { BarcodeStrip, ScoreDistributionWaveform } from "@/components/telemetry/telemetry-primitives";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Shuffle } from "lucide-react";
import { useMemo } from "react";

interface CockpitHeroConsoleProps {
  activeLicense: LicenseClass;
  randomTemplateQuiz?: QuizSummary;
}

function getExamDistribution(code: string, total: number) {
  if (code === "A1" || code === "A") {
    return {
      rules: { label: "QUY TẮC", count: 18, percent: 45 },
      signs: { label: "BIỂN BÁO", count: 12, percent: 30 },
      situations: { label: "SA HÌNH", count: 10, percent: 25 },
      critical: { label: "ĐIỂM LIỆT", count: 2 },
    };
  }
  if (code === "B") {
    return {
      rules: { label: "QUY TẮC", count: 13, percent: 43 },
      signs: { label: "BIỂN BÁO", count: 10, percent: 33 },
      situations: { label: "SA HÌNH", count: 7, percent: 24 },
      critical: { label: "ĐIỂM LIỆT", count: 1 },
    };
  }
  if (code === "C1") {
    return {
      rules: { label: "QUY TẮC", count: 15, percent: 43 },
      signs: { label: "BIỂN BÁO", count: 11, percent: 31 },
      situations: { label: "SA HÌNH", count: 9, percent: 26 },
      critical: { label: "ĐIỂM LIỆT", count: 1 },
    };
  }
  if (code === "C") {
    return {
      rules: { label: "QUY TẮC", count: 18, percent: 45 },
      signs: { label: "BIỂN BÁO", count: 12, percent: 30 },
      situations: { label: "SA HÌNH", count: 10, percent: 25 },
      critical: { label: "ĐIỂM LIỆT", count: 1 },
    };
  }
  return {
    rules: { label: "QUY TẮC", count: 20, percent: 44 },
    signs: { label: "BIỂN BÁO", count: 14, percent: 31 },
    situations: { label: "SA HÌNH", count: 11, percent: 25 },
    critical: { label: "ĐIỂM LIỆT", count: 1 },
  };
}

export function CockpitHeroConsole({
  activeLicense,
  randomTemplateQuiz,
}: CockpitHeroConsoleProps) {
  const dist = useMemo(
    () => getExamDistribution(activeLicense.code, activeLicense.totalQuestions),
    [activeLicense.code, activeLicense.totalQuestions]
  );

  return (
    <section className="border border-border bg-card/80 p-4 sm:p-6 flex flex-col gap-6 relative select-none">
      {/* Top Console Telemetry Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-muted-foreground border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <BarcodeStrip height={12} bars={[2, 1, 3, 2, 1, 4, 1, 2, 2, 1]} />
          <span className="font-bold text-foreground">
            ASSESSMENT TELEMETRY CONSOLE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <strong className="text-primary font-bold">STATUS: READY</strong>
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="tabular-nums">SYS ID: QCL-600</span>
        </div>
      </div>

      {/* Main Grid: Left Typographic Core & Right Telemetry Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Bold Typographic Statement & Quick Action Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono uppercase leading-tight">
              Ôn Thi Sát Hạch Lái Xe Chuẩn Xác & Trực Quan
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Hệ thống mô phỏng kiểm định sát hạch lý thuyết lái xe thời gian thực.
              Kho 600 câu hỏi chính quy, cảnh báo tức thì 60 tình huống điểm liệt,
              đo lường kết quả theo tiêu chuẩn Cục CSGT.
            </p>
          </div>

          {/* Action Button Strip with Barcode Ends */}
          <div className="flex items-center flex-wrap gap-3 pt-1">
            {randomTemplateQuiz ? (
              <Button
                size="default"
                render={<Link href={`/thi-sat-hach/${randomTemplateQuiz.quizId}`} />}
                nativeButton={false}
                className="h-10 px-4 gap-2.5 font-mono text-xs font-bold uppercase border border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
              >
                <BarcodeStrip height={12} className="opacity-90" />
                <Shuffle className="size-3.5" />
                <span>Thi Đề Ngẫu Nhiên ({activeLicense.code})</span>
                <BarcodeStrip height={12} className="opacity-90" />
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="default"
              render={<Link href="/cau-hoi" />}
              nativeButton={false}
              className="h-10 px-4 gap-2 font-mono text-xs font-semibold uppercase border-border hover:border-primary hover:bg-muted/40 cursor-pointer"
            >
              <BookOpen className="size-3.5 text-primary" />
              <span>Tra cứu 600 câu hỏi</span>
            </Button>
          </div>

          {/* Bottom 4-Metric Instrument Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/60 text-xs font-mono">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase text-muted-foreground">Hạng Sát Hạch</span>
              <span className="font-bold text-foreground">11 HẠNG ĐỘC LẬP</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase text-muted-foreground">Kho Câu Hỏi</span>
              <span className="font-bold text-foreground tabular-nums">600 CÂU LÝ THUYẾT</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase text-muted-foreground">Câu Điểm Liệt</span>
              <span className="font-bold text-destructive tabular-nums">60 CÂU BẮT BUỘC</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase text-muted-foreground">Chuẩn Đạt</span>
              <span className="font-bold text-primary tabular-nums">≥ 90% ĐIỂM</span>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Score Histogram & Question Matrix HUD (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 border border-border bg-background/50 p-3.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pb-2 border-b border-border/50">
            <span className="font-bold text-foreground uppercase flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>PHỔ ĐIỂM // {activeLicense.name}</span>
            </span>
            <span className="text-primary font-bold">
              CHUẨN ĐẠT: {activeLicense.passScore}/{activeLicense.totalQuestions}Đ
            </span>
          </div>

          {/* Interactive Score Distribution Spectrogram */}
          <ScoreDistributionWaveform
            licenseCode={activeLicense.code}
            questionCount={activeLicense.totalQuestions}
            passScore={activeLicense.passScore}
          />

          {/* Question Matrix Distribution - Gói 2: 4 ô Quy tắc / Biển báo / Sa hình / Điểm liệt */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center font-mono pt-1 border-t border-border/50">
            <div className="flex flex-col p-1.5 bg-muted/30 border border-border/60">
              <span className="text-[9px] uppercase text-muted-foreground">QUY TẮC</span>
              <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                {dist.rules.count} CÂU
              </span>
              <span className="text-[9px] text-muted-foreground">{dist.rules.percent}% ĐỀ</span>
            </div>

            <div className="flex flex-col p-1.5 bg-muted/30 border border-border/60">
              <span className="text-[9px] uppercase text-muted-foreground">BIỂN BÁO</span>
              <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                {dist.signs.count} CÂU
              </span>
              <span className="text-[9px] text-muted-foreground">{dist.signs.percent}% ĐỀ</span>
            </div>

            <div className="flex flex-col p-1.5 bg-muted/30 border border-border/60">
              <span className="text-[9px] uppercase text-muted-foreground">SA HÌNH</span>
              <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                {dist.situations.count} CÂU
              </span>
              <span className="text-[9px] text-muted-foreground">{dist.situations.percent}% ĐỀ</span>
            </div>

            <div className="flex flex-col p-1.5 bg-destructive/10 border border-destructive/30">
              <span className="text-[9px] uppercase text-destructive font-bold">ĐIỂM LIỆT</span>
              <span className="text-xs sm:text-sm font-bold text-destructive tabular-nums">
                {dist.critical.count} CÂU
              </span>
              <span className="text-[9px] text-destructive/80 font-bold">SAI = TRƯỢT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
