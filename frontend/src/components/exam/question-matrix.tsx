"use client";

import React, { useMemo } from "react";
import type { ExamQuestion } from "@/lib/api-client";
import { Flag, Check } from "lucide-react";

interface QuestionMatrixProps {
  questions: ExamQuestion[];
  currentIndex: number;
  selectedAnswers: Record<number, number>; // questionId -> answerId
  flaggedQuestionIds: number[];
  onSelectQuestion: (index: number) => void;
  onToggleAnswer: (questionId: number, answerId: number) => void;
  isPractice?: boolean;
}

export function QuestionMatrix({
  questions,
  currentIndex,
  selectedAnswers,
  flaggedQuestionIds,
  onSelectQuestion,
  onToggleAnswer,
  isPractice,
}: QuestionMatrixProps) {
  // Luôn luôn chia thành 3 cột đồng đều cho TẤT CẢ các bộ đề (30 câu -> 10/cột; 35 câu -> 12/cột; 25 câu -> 9/cột)
  const columns = useMemo(() => {
    const total = questions.length;
    const itemsPerCol = Math.ceil(total / 3);
    const cols: ExamQuestion[][] = [];
    for (let i = 0; i < total; i += itemsPerCol) {
      cols.push(questions.slice(i, i + itemsPerCol));
    }
    // Đảm bảo luôn có đúng 3 mảng cột
    while (cols.length < 3) {
      cols.push([]);
    }
    return cols;
  }, [questions]);

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3 rounded-lg border border-border/80 bg-card overflow-hidden w-full">
      {/* Header nhỏ hiển thị tiến độ ma trận */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-border/60 text-xs">
        <span className="font-bold text-foreground">Bảng ma trận câu hỏi</span>
        <span className="font-mono text-muted-foreground text-[11px] tabular-nums">
          Đã làm: <strong className="text-primary">{answeredCount}</strong>/{questions.length} câu
        </span>
      </div>

      {/* Grid luôn chia đều 3 cột song song */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pb-1 overflow-y-auto max-h-[580px] w-full">
        {columns.map((colQuestions, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-1.5 min-w-0">
            {colQuestions.map((q) => {
              const globalIndex = questions.findIndex((item) => item.id === q.id);
              const isCurrent = globalIndex === currentIndex;
              const selectedAnswerId = selectedAnswers[q.id];
              const isFlagged = flaggedQuestionIds.includes(q.id);
              const hasAnswered = selectedAnswerId !== undefined;

              // Option count (thường là 2, 3 hoặc 4 đáp án)
              const optionCount = Math.max(2, q.answers?.length || 4);
              const optionIndices = Array.from({ length: optionCount }, (_, i) => i);

              // Styling row
              let rowStyle = "bg-muted/30 border-border/70 hover:border-border text-foreground";
              if (isCurrent) {
                // Nổi bật câu đang làm như trong phần mềm sát hạch
                rowStyle = "bg-primary text-primary-foreground border-primary shadow-xs font-semibold";
              } else if (hasAnswered) {
                rowStyle = "bg-primary/5 border-primary/30 text-foreground";
              }

              return (
                <div
                  key={q.id}
                  className={`flex items-center justify-between px-1.5 sm:px-2 py-1 rounded border transition-colors ${rowStyle}`}
                >
                  {/* Left: Question Number */}
                  <button
                    type="button"
                    onClick={() => onSelectQuestion(globalIndex)}
                    className="flex items-center gap-1 cursor-pointer font-mono text-xs font-bold tabular-nums pr-1 focus:outline-none shrink-0"
                    title={`Đến câu ${globalIndex + 1}`}
                  >
                    <span>{globalIndex + 1}</span>
                    {isFlagged && (
                      <Flag
                        className={`w-3 h-3 fill-current ${
                          isCurrent ? "text-amber-200" : "text-amber-500"
                        }`}
                      />
                    )}
                  </button>

                  {/* Right: Answer Columns (1 2 3 4) with square Checkboxes */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {optionIndices.map((optIdx) => {
                      const answer = q.answers?.[optIdx];
                      if (!answer) return null;

                      const isChosen = selectedAnswerId === answer.id;

                      // Practice mode correct/wrong indicator
                      let checkStyle = "border-border/80 bg-background/80 hover:border-foreground";
                      if (isCurrent) {
                        checkStyle = isChosen
                          ? "bg-primary-foreground text-primary border-primary-foreground font-bold"
                          : "border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/20";
                      } else if (isPractice && hasAnswered) {
                        if (q.correctAnswerId === answer.id) {
                          checkStyle = "bg-emerald-600 text-white border-emerald-600 font-bold";
                        } else if (isChosen) {
                          checkStyle = "bg-destructive text-white border-destructive font-bold";
                        }
                      } else if (isChosen) {
                        checkStyle = "bg-primary text-primary-foreground border-primary font-bold";
                      }

                      return (
                        <div
                          key={answer.id}
                          className="flex flex-col items-center justify-center cursor-pointer select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectQuestion(globalIndex);
                            onToggleAnswer(q.id, answer.id);
                          }}
                        >
                          <span
                            className={`text-[9px] font-mono leading-none mb-0.5 ${
                              isCurrent ? "text-primary-foreground/90 font-bold" : "text-muted-foreground"
                            }`}
                          >
                            {optIdx + 1}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-all ${checkStyle}`}
                          >
                            {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
