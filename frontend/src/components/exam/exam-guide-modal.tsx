"use client";

import React from "react";
import { X, Keyboard, ShieldAlert, CheckCircle2, Clock } from "lucide-react";

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
  licenseClassCode = "B2",
  passScore = 32,
  totalQuestions = 35,
}: ExamGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base">Hướng dẫn thao tác & Quy chế phòng thi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="flex flex-col gap-3 text-xs leading-relaxed">
          <div className="font-bold text-sm text-primary flex items-center gap-1.5">
            <span>1. Thao tác phím tắt nhanh (Bàn phím):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/40 p-3 rounded-md border border-border/60">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-xs shadow-2xs">
                1, 2, 3, 4
              </kbd>
              <span>Chọn / bỏ chọn đáp án</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-xs shadow-2xs">
                ↑ / ↓
              </kbd>
              <span>Chuyển câu trước / sau</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-xs shadow-2xs">
                ← / →
              </kbd>
              <span>Chuyển câu hỏi</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-xs shadow-2xs">
                F
              </kbd>
              <span>Đánh dấu cờ xem lại</span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-xs shadow-2xs">
                ESC
              </kbd>
              <span>Mở hộp thoại KẾT THÚC bài thi</span>
            </div>
          </div>

          {/* Rules and Pass Score */}
          <div className="font-bold text-sm text-primary flex items-center gap-1.5 pt-1">
            <span>2. Quy chuẩn sát hạch ({licenseClassCode}):</span>
          </div>

          <div className="flex flex-col gap-2 bg-muted/40 p-3 rounded-md border border-border/60">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Yêu cầu đạt: Trả lời đúng tối thiểu{" "}
                <strong className="text-foreground font-bold">
                  {passScore}/{totalQuestions} câu
                </strong>
                .
              </span>
            </div>

            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span>
                <strong className="text-destructive font-bold">Lưu ý điểm liệt:</strong> Tuyệt đối không được làm sai
                câu hỏi điểm liệt (tình huống mất an toàn giao thông nghiêm trọng). Sai 1 câu điểm liệt sẽ bị tính{" "}
                <strong className="text-destructive font-bold">KHÔNG ĐẠT</strong> ngay lập tức.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Hết thời gian đếm ngược, hệ thống sẽ tự động nộp bài và chuyển đến bảng phân tích kết quả chi tiết.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Đã hiểu, tiếp tục làm bài
          </button>
        </div>
      </div>
    </div>
  );
}
