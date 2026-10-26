import { getAccessToken } from "./auth-cookies";

const BACKEND_URL =
  typeof window === "undefined"
    ? process.env.BACKEND_INTERNAL_URL || "http://localhost:5254"
    : "";

export interface QuizSummary {
  quizId: number;
  title: string;
  detail: string;
  totalQuestions: number;
  updatedAt: string | null;
}

export interface ExamAnswerOption {
  id: number;
  content: string;
}

export interface ExamQuestion {
  id: number;
  content: string;
  image: string | null;
  answers: ExamAnswerOption[];
}

export interface QuizExamDetail {
  quizId: number;
  title: string;
  detail: string;
  totalQuestions: number;
  questions: ExamQuestion[];
}

export interface GradedAnswerOption {
  id: number;
  content: string;
  isCorrect: boolean;
}

export interface GradedQuestion {
  id: number;
  content: string;
  image: string | null;
  status: string;
  selectedAnswerId: number | null;
  answers: GradedAnswerOption[];
}

export interface TestSubmitResult {
  takeId: number | null;
  quizId: number;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  isGuest: boolean;
  startedAt: string;
  completedAt: string;
  questions: GradedQuestion[];
}

export interface TakeHistoryItem {
  takeId: number;
  quizId: number;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicQuestionDetail {
  questionId: number;
  content: string;
  score: number;
  image: string | null;
  answers: GradedAnswerOption[];
  inQuizzes: string[];
}

export interface PublicQuestionItem {
  questionId: number;
  content: string;
  score: number;
  hasImage: boolean;
}

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Nếu chạy trên server, tự động đính kèm token từ cookie nếu có
    if (typeof window === "undefined" && !headers.has("Authorization")) {
      const token = await getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 204) {
      return { data: null, error: null, status: 204 };
    }

    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const problem = await res.json();
        errMsg = problem.detail || problem.title || errMsg;
      } catch {
        // Fallback to text
      }
      return { data: null, error: errMsg, status: res.status };
    }

    const data = (await res.json()) as T;
    return { data, error: null, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: message, status: 500 };
  }
}
