"use client";

import type { LicenseClass } from "@/lib/api-client";
import { Bike, Car } from "lucide-react";

interface LicenseClassStripProps {
  licenses: LicenseClass[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export function LicenseClassStrip({
  licenses,
  selectedCode,
  onSelect,
}: LicenseClassStripProps) {
  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between flex-wrap gap-2 px-0.5 text-xs font-mono">
        <span className="font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <span>// CHỌN HẠNG SÁT HẠCH</span>
          <span className="text-[10px] text-muted-foreground font-normal">
            (THÔNG TƯ 108/2026/TT-BCA)
          </span>
        </span>
        <span className="text-muted-foreground text-[11px]">
          11 HẠNG GPLX ĐỘC LẬP
        </span>
      </div>

      {/* 11-Bay Console Strip */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-1.5 p-1 bg-card border border-border">
        {licenses.map((lic, index) => {
          const isSelected = lic.code === selectedCode;
          const isMoto = lic.vehicleGroup === "Motorbike";
          const bayIndex = String(index + 1).padStart(2, "0");

          return (
            <button
              key={lic.code}
              type="button"
              onClick={() => onSelect(lic.code)}
              className={`relative flex flex-col items-center justify-between py-2 px-1 text-center transition-all cursor-pointer border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-background/80 text-foreground border-border/60 hover:border-primary/50 hover:bg-muted/40"
              }`}
              aria-pressed={isSelected}
            >
              {/* Bay Number & Vehicle Icon */}
              <div className="w-full flex items-center justify-between px-1 text-[9px] font-mono opacity-70">
                <span>{bayIndex}</span>
                {isMoto ? <Bike className="size-3" /> : <Car className="size-3" />}
              </div>

              {/* License Code */}
              <span className="text-sm sm:text-base font-extrabold font-mono tracking-tight my-0.5">
                {lic.code}
              </span>

              {/* Specs */}
              <span
                className={`text-[9px] font-mono tabular-nums leading-none ${
                  isSelected ? "text-primary-foreground/90 font-bold" : "text-muted-foreground"
                }`}
              >
                {lic.totalQuestions}Q • {lic.durationMinutes}M
              </span>

              {/* Active Indicator Strip */}
              {isSelected && (
                <span className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
