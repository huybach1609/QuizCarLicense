"use client";

import type { LicenseClass } from "@/lib/api-client";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, Clock, HelpCircle } from "lucide-react";

interface LicenseTelemetryHudProps {
  activeLicense: LicenseClass;
}

export function LicenseTelemetryHud({ activeLicense }: LicenseTelemetryHudProps) {
  return (
    <div className="border border-border bg-card p-4 sm:p-5 flex flex-col gap-4 select-none">
      {/* Header Info Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/70 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap font-mono">
          <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold px-2 py-0.5 rounded-none font-mono">
            {activeLicense.name}
          </Badge>
          <span className="text-muted-foreground uppercase">
            // {activeLicense.vehicleGroup === "Motorbike" ? "MÔ TÔ HAI BÁNH" : "Ô TÔ & XE CHUYÊN DÙNG"}
          </span>
          <span className="text-muted-foreground/30 hidden sm:inline">•</span>
          <span className="text-foreground/90 font-sans text-xs">
            {activeLicense.description}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-muted-foreground">
          <BarcodeStrip height={10} bars={[1, 2, 1, 3, 1, 2]} />
          <span>SPEC // {activeLicense.code}-REGULATION</span>
        </div>
      </div>

      {/* 4-Instrument Telemetry Cells */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Cell 1: Total Questions */}
        <div className="p-3 bg-background/80 border border-border flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase">
            <span>SỐ LƯỢNG CÂU HỎI</span>
            <HelpCircle className="size-3" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
            {activeLicense.totalQuestions} <span className="text-xs font-normal text-muted-foreground">câu</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Rút tự động từ 600 câu</span>
        </div>

        {/* Cell 2: Duration */}
        <div className="p-3 bg-background/80 border border-border flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase">
            <span>THỜI GIAN LÀM BÀI</span>
            <Clock className="size-3" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
            {activeLicense.durationMinutes} <span className="text-xs font-normal text-muted-foreground">phút</span>
          </div>
        </div>

        {/* Cell 3: Pass Score */}
        <div className="p-3 bg-primary/5 border border-primary/30 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-primary text-[10px] uppercase font-bold">
            <span>ĐIỂM ĐẠT TỐI THIỂU</span>
            <CheckCircle2 className="size-3" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-primary tabular-nums">
            {activeLicense.passScore}/{activeLicense.totalQuestions} <span className="text-xs font-normal opacity-80">điểm</span>
          </div>
          <span className="text-[10px] text-primary/80">Tỷ lệ chính xác ≥ 90%</span>
        </div>

        {/* Cell 4: Critical Question Hazard */}
        <div className="p-3 bg-destructive/5 border border-destructive/30 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-destructive text-[10px] uppercase font-bold">
            <span>ĐIỀU KIỆN ĐẶC BIỆT</span>
            <ShieldAlert className="size-3" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-destructive leading-tight">
            SAI ĐIỂM LIỆT = TRƯỢT
          </div>
          <span className="text-[10px] text-destructive/80">Đánh giá Không Đạt lập tức</span>
        </div>
      </div>
    </div>
  );
}
