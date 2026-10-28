"use client";

import React from "react";
import { X, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";

interface ExamGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseClassCode?: string | null;
  passScore?: number;
  totalQuestions?: number;
}

export function ExamGuideModal({
  isOpen,
  onClose,
  licenseClassCode = "B",
  passScore = 27,
  totalQuestions = 30,
}: ExamGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border max-w-lg w-full p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-foreground font-mono select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <BarcodeStrip height={12} bars={[1, 3, 1, 2, 1]} className="text-primary" />
            <h3 className="font-bold text-sm uppercase text-foreground">
              {"//"} HƯỚNG DẪN THAO TÁC PHÒNG THI SÁT HẠCH
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="flex flex-col gap-3 text-xs">
          <span className="font-bold text-primary text-[11px] uppercase">
            1. BẢNG PHÍM TẮT THAO TÁC NHANH:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background/80 p-3 border border-border/70">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-muted border border-border font-mono font-bold text-xs">
                1, 2, 3, 4
              </kbd>
              <span className="text-[11px] text-muted-foreground">Chọn / Hủy đáp án</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-muted border border-border font-mono font-bold text-xs">
                ↑ / ↓
              </kbd>
              <span className="text-[11px] text-muted-foreground">Chuyển câu trước / sau</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-muted border border-border font-mono font-bold text-xs">
                ← / →
              </kbd>
              <span className="text-[11px] text-muted-foreground">Chuyển câu hỏi</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-muted border border-border font-mono font-bold text-xs">
                F
              </kbd>
              <span className="text-[11px] text-muted-foreground">Đánh dấu cờ xem lại</span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1 border-t border-border/40">
              <kbd className="px-2 py-0.5 bg-muted border border-border font-mono font-bold text-xs">
                ESC
              </kbd>
              <span className="text-[11px] text-muted-foreground">Mở hộp thoại KẾT THÚC bài thi</span>
            </div>
          </div>

          {/* Quy chuẩn đạt */}
          <span className="font-bold text-primary text-[11px] uppercase pt-1">
            2. QUY CHUẨN ĐẠT (HẠNG {licenseClassCode}):
          </span>

          <div className="flex flex-col gap-2 bg-background/80 p-3 border border-border/70 text-[11px] font-sans">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                Điểm đạt yêu cầu: <strong className="font-mono text-foreground font-bold">{passScore}/{totalQuestions} câu</strong>.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <ShieldAlert className="size-4 text-destructive shrink-0 mt-0.5" />
              <span>
                <strong className="text-destructive font-bold font-mono">ĐIỂM LIỆT:</strong> Tuyệt đối không được làm sai câu hỏi điểm liệt. Sai 1 câu điểm liệt sẽ bị tính <strong className="text-destructive font-bold">KHÔNG ĐẠT</strong> ngay lập tức.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                Hết thời gian đếm ngược, bài thi sẽ tự động kết thúc và hiển thị bảng phân tích kết quả.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-mono font-bold uppercase hover:bg-primary/90 transition-colors cursor-pointer"
          >
            TIẾP TỤC LÀM BÀI
          </button>
        </div>
      </div>
    </div>
  );
}
