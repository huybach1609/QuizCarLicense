"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/routing";
import Image from "next/image";
import type { PublicQuestionDetail } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";
import {
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface QuestionDetailModalProps {
  question: PublicQuestionDetail;
}

export function QuestionDetailModal({ question }: QuestionDetailModalProps) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      router.back();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-none border border-border bg-card flex flex-col gap-4">
        {/* Header Console */}
        <DialogHeader className="gap-2 border-b border-border/80 pb-3 pr-8">
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <span className="px-2 py-0.5 border border-primary/40 bg-primary/10 text-primary font-bold">
              CÂU #{question.questionId.toString().padStart(3, "0")}
            </span>
            {question.categoryTitle && (
              <Badge variant="outline" className="rounded-none border-border font-mono text-[11px]">
                {question.categoryTitle}
              </Badge>
            )}
            {question.isCritical && (
              <Badge variant="destructive" className="rounded-none font-mono text-[11px] uppercase">
                <ShieldAlert className="size-2.5 mr-1" />
                <span>ĐIỂM LIỆT</span>
              </Badge>
            )}
            <BarcodeStrip height={10} bars={[1, 2, 1, 2, 1]} className="text-muted-foreground ml-auto hidden sm:block" />
          </div>

          <DialogTitle className="text-sm sm:text-base font-bold font-sans text-foreground leading-relaxed text-left">
            {question.content}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem chi tiết câu hỏi số {question.questionId} và đáp án chuẩn.
          </DialogDescription>
        </DialogHeader>

        {/* Critical Rule Warning */}
        {question.isCritical && (
          <Alert variant="destructive" className="rounded-none border-destructive/40 bg-destructive/10 font-sans py-2">
            <ShieldAlert className="size-3.5 text-destructive" />
            <AlertTitle className="font-mono text-[11px] font-bold uppercase text-destructive">
              CÂU HỎI ĐIỂM LIỆT (BẮT BUỘC ĐÚNG)
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-0.5">
              Trả lời sai câu này trong bài thi sẽ bị <strong>truất quyền sát hạch</strong> ngay lập tức.
            </AlertDescription>
          </Alert>
        )}

        {/* Diagram / Traffic Sign Image (If present) */}
        {question.image && question.image !== "none" && (
          <div className="flex flex-col items-center gap-1.5 my-1">
            <div className="relative w-full max-w-md h-48 sm:h-60 border border-border overflow-hidden bg-background/50 flex items-center justify-center p-2">
              <Image
                src={question.image}
                alt={`Hình minh họa câu hỏi số ${question.questionId}`}
                fill
                sizes="(max-width: 640px) 100vw, 448px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {"//"} HÌNH MINH HỌA CÂU #{question.questionId}
            </span>
          </div>
        )}

        {/* Answers List */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">
            LỰA CHỌN ĐÁP ÁN:
          </span>

          {question.answers.map((ans, idx) => {
            const letter = String.fromCharCode(65 + idx);

            return (
              <div
                key={ans.id}
                className={`flex items-start gap-2.5 p-3 border transition-all text-xs sm:text-sm ${
                  ans.isCorrect
                    ? "bg-primary/10 border-primary text-foreground font-medium"
                    : "border-border bg-background/50 text-muted-foreground"
                }`}
              >
                <span
                  className={`size-5 flex items-center justify-center text-[11px] font-mono font-bold shrink-0 border ${
                    ans.isCorrect
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {letter}
                </span>

                <span className="leading-relaxed font-sans flex-1">
                  {ans.content}
                </span>

                {ans.isCorrect && (
                  <Badge
                    variant="default"
                    className="ml-auto text-[10px] font-mono uppercase rounded-none shrink-0"
                  >
                    <CheckCircle2 className="size-2.5 mr-1" />
                    <span>ĐÚNG</span>
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* disable component Explanation Callout */}
        {/* {question.explanation && (
          <Alert variant="default" className="rounded-none border-primary/40 bg-primary/5 font-sans py-2.5">
            <Lightbulb className="size-3.5 text-primary" />
            <AlertTitle className="font-mono text-xs font-bold uppercase text-primary">
              GIẢI THÍCH ĐÁP ÁN & MẸO NHỚ
            </AlertTitle>
            <AlertDescription className="text-xs text-foreground/90 leading-relaxed mt-0.5">
              {question.explanation}
            </AlertDescription>
          </Alert>
        )} */}

        {/* In Quizzes */}
        {question.inQuizzes && question.inQuizzes.length > 0 && (
          <div className="pt-2 border-t border-border flex flex-col gap-1.5 text-xs font-mono">
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <BookOpen className="size-3 text-primary" />
              <span>CÓ TRONG BỘ ĐỀ:</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {question.inQuizzes.map((title, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 border border-border bg-muted/60 text-muted-foreground text-[10px]"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border font-mono text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            {question.prevQuestionId && (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/cau-hoi/${question.prevQuestionId}`} />}
                nativeButton={false}
                className="h-7 px-2 font-mono text-xs rounded-none cursor-pointer"
              >
                <ChevronLeft data-icon="inline-start" className="size-3" />
                <span>#{question.prevQuestionId}</span>
              </Button>
            )}
            {question.nextQuestionId && (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/cau-hoi/${question.nextQuestionId}`} />}
                nativeButton={false}
                className="h-7 px-2 font-mono text-xs rounded-none cursor-pointer"
              >
                <span>#{question.nextQuestionId}</span>
                <ChevronRight data-icon="inline-end" className="size-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              render={
                <a
                  href={`/cau-hoi/${question.questionId}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              nativeButton={false}
              className="h-7 gap-1 px-2.5 font-mono text-xs rounded-none cursor-pointer"
            >
              <ExternalLink data-icon="inline-start" className="size-3" />
              <span>Mở tab mới</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              className="h-7 px-3 font-mono text-xs uppercase font-bold rounded-none cursor-pointer"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}