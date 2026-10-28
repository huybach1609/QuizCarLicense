"use client";

import React, { useMemo } from "react";
import type { ExamQuestion } from "@/lib/api-client";
import { Flag, Check } from "lucide-react";
import { DensityBar } from "@/components/telemetry/telemetry-primitives";

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
  // Chia đều 3 cột song song cho mọi bộ đề (30 câu -> 10/cột; 35 câu -> 12/cột; 40 câu -> 14/cột; 45 câu -> 15/cột)
  const columns = useMemo(() => {
    const total = questions.length;
    const itemsPerCol = Math.ceil(total / 3);
    const cols: ExamQuestion[][] = [];
    for (let i = 0; i < total; i += itemsPerCol) {
      cols.push(questions.slice(i, i + itemsPerCol));
    }
    while (cols.length < 3) {
      cols.push([]);
    }
    return cols;
  }, [questions]);

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="border border-border bg-card p-2 sm:p-2.5 flex flex-col gap-2 font-mono text-xs select-none w-full">
      {/* Header tích hợp DensityBar đo tiến độ ma trận trực tiếp */}
      <div className="flex items-center justify-between px-1 pb-1.5 border-b border-border/70 text-[11px]">
        <span className="font-bold uppercase text-foreground">
          {"//"} MA TRẬN ĐỀ THI
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[10px]">TIẾN ĐỘ:</span>
          <DensityBar
            value={answeredCount}
            max={questions.length}
            segments={10}
            className="text-[10px]"
          />
        </div>
      </div>

      {/* Grid 3 cột song song */}
      <div className="grid grid-cols-3 gap-1.5 pb-0.5 overflow-y-auto max-h-[580px] w-full">
        {columns.map((colQuestions, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-1 min-w-0">
            {colQuestions.map((q) => {
              const globalIndex = questions.findIndex((item) => item.id === q.id);
              const isCurrent = globalIndex === currentIndex;
              const selectedAnswerId = selectedAnswers[q.id];
              const isFlagged = flaggedQuestionIds.includes(q.id);
              const hasAnswered = selectedAnswerId !== undefined;
              const formattedNum = String(globalIndex + 1).padStart(2, "0");

              // Option count (2, 3 hoặc 4)
              const optionCount = Math.max(2, q.answers?.length || 4);
              const optionIndices = Array.from({ length: optionCount }, (_, i) => i);

              // Row styling
              let rowStyle = "bg-background/80 border-border/60 hover:border-border text-foreground";
              if (isCurrent) {
                rowStyle = "bg-primary text-primary-foreground border-primary font-bold shadow-xs";
              } else if (hasAnswered) {
                rowStyle = "bg-muted/40 border-border text-foreground";
              }

              return (
                <div
                  key={q.id}
                  onClick={() => onSelectQuestion(globalIndex)}
                  className={`flex items-center justify-between px-1.5 py-1 border transition-colors cursor-pointer ${rowStyle}`}
                  title={`Đến câu ${globalIndex + 1}`}
                >
                  {/* Left: Question Number */}
                  <div className="flex items-center gap-1 font-mono text-xs font-bold tabular-nums pr-1 shrink-0 select-none">
                    <span>{formattedNum}</span>
                    {isFlagged && (
                      <Flag
                        className={`size-2.5 fill-current ${
                          isCurrent ? "text-primary-foreground" : "text-amber-500"
                        }`}
                      />
                    )}
                  </div>

                  {/* Right: Answer Checkboxes (1 2 3 4) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {optionIndices.map((optIdx) => {
                      const answer = q.answers?.[optIdx];
                      if (!answer) return null;

                      const isChosen = selectedAnswerId === answer.id;

                      let checkStyle = "border-border/80 bg-background/90 hover:border-foreground";
                      if (isCurrent) {
                        checkStyle = isChosen
                          ? "bg-primary-foreground text-primary border-primary-foreground font-bold"
                          : "border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/20";
                      } else if (isPractice && hasAnswered) {
                        if (q.correctAnswerId === answer.id) {
                          checkStyle = "bg-primary text-primary-foreground border-primary font-bold";
                        } else if (isChosen) {
                          checkStyle = "bg-destructive text-destructive-foreground border-destructive font-bold";
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
                          <div
                            className={`size-3.5 border flex items-center justify-center transition-all ${checkStyle}`}
                          >
                            {isChosen && <Check className="size-2.5 stroke-[3]" />}
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
