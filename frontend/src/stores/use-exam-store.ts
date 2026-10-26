import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ActiveExamSession {
  version: 1;
  quizId: number;
  quizTitle: string;
  startTime: string; // ISO 8601
  durationSeconds: number;
  selectedAnswers: Record<number, number>; // questionId -> answerId
  flaggedQuestionIds: number[];
  currentIndex: number;
  questionIds?: number[];
}

interface ExamStoreState {
  currentSession: ActiveExamSession | null;
  startSession: (
    quizId: number,
    quizTitle: string,
    durationMinutes?: number,
    questionIds?: number[]
  ) => void;
  selectAnswer: (questionId: number, answerId: number) => void;
  toggleAnswer: (questionId: number, answerId: number) => void;
  toggleFlag: (questionId: number) => void;
  setCurrentIndex: (index: number) => void;
  clearSession: () => void;
}

export const useExamStore = create<ExamStoreState>()(
  persist(
    (set, get) => ({
      currentSession: null,

      startSession: (
        quizId: number,
        quizTitle: string,
        durationMinutes = 20,
        questionIds?: number[]
      ) => {
        const existing = get().currentSession;
        // Nếu đã có session đang chạy của đúng quiz này, giữ nguyên để không mất bài
        if (existing && existing.quizId === quizId) {
          return;
        }

        const newSession: ActiveExamSession = {
          version: 1,
          quizId,
          quizTitle,
          startTime: new Date().toISOString(),
          durationSeconds: durationMinutes * 60,
          selectedAnswers: {},
          flaggedQuestionIds: [],
          currentIndex: 0,
          questionIds,
        };

        set({ currentSession: newSession });
      },

      selectAnswer: (questionId: number, answerId: number) => {
        const session = get().currentSession;
        if (!session) return;

        set({
          currentSession: {
            ...session,
            selectedAnswers: {
              ...session.selectedAnswers,
              [questionId]: answerId,
            },
          },
        });
      },

      toggleAnswer: (questionId: number, answerId: number) => {
        const session = get().currentSession;
        if (!session) return;

        const current = session.selectedAnswers[questionId];
        const newSelected = { ...session.selectedAnswers };
        if (current === answerId) {
          delete newSelected[questionId];
        } else {
          newSelected[questionId] = answerId;
        }

        set({
          currentSession: {
            ...session,
            selectedAnswers: newSelected,
          },
        });
      },

      toggleFlag: (questionId: number) => {
        const session = get().currentSession;
        if (!session) return;

        const isFlagged = session.flaggedQuestionIds.includes(questionId);
        const newFlags = isFlagged
          ? session.flaggedQuestionIds.filter((id) => id !== questionId)
          : [...session.flaggedQuestionIds, questionId];

        set({
          currentSession: {
            ...session,
            flaggedQuestionIds: newFlags,
          },
        });
      },

      setCurrentIndex: (index: number) => {
        const session = get().currentSession;
        if (!session) return;

        set({
          currentSession: {
            ...session,
            currentIndex: index,
          },
        });
      },

      clearSession: () => {
        set({ currentSession: null });
      },
    }),
    {
      name: "qcl:exam-session:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
