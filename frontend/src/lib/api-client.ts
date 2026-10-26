import { getAccessToken } from "./auth-cookies";

const BACKEND_URL =
  typeof window === "undefined"
    ? process.env.BACKEND_INTERNAL_URL || "http://localhost:5254"
    : "";

export interface LicenseClass {
  licenseClassId: number;
  code: string;
  name: string;
  description: string;
  vehicleGroup: "Motorbike" | "Car" | string;
  totalQuestions: number;
  durationMinutes: number;
  passScore: number;
  displayOrder: number;
  examSetCount: number;
}

export interface QuestionCategory {
  categoryId: number;
  code: string;
  title: string;
  description: string | null;
  displayOrder: number;
  questionCount: number;
  practiceQuizId: number | null;
}

export interface QuizSummary {
  quizId: number;
  title: string;
  detail: string;
  totalQuestions: number;
  updatedAt: string | null;
  licenseClassCode?: string | null;
  licenseClassName?: string | null;
  quizType?: string;
  examNumber?: number | null;
  durationMinutes?: number;
  passScore?: number;
  isPracticeMode?: boolean;
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
  isCritical?: boolean;
  explanation?: string | null;
  correctAnswerId?: number | null;
}

export interface QuizExamDetail {
  quizId: number;
  title: string;
  detail: string;
  totalQuestions: number;
  questions: ExamQuestion[];
  licenseClassCode?: string | null;
  licenseClassName?: string | null;
  quizType?: string;
  durationMinutes?: number;
  passScore?: number;
  isPracticeMode?: boolean;
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
  isCritical?: boolean;
  explanation?: string | null;
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
  passScore?: number;
  isPassed?: boolean;
  hasCriticalError?: boolean;
  licenseClassCode?: string | null;
}

export interface TakeHistoryItem {
  takeId: number;
  quizId: number;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt: string | null;
  passScore?: number;
  isPassed?: boolean;
  hasCriticalError?: boolean;
  licenseClassCode?: string | null;
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
  isCritical?: boolean;
  categoryTitle?: string | null;
  explanation?: string | null;
}

export interface PublicQuestionItem {
  questionId: number;
  content: string;
  score: number;
  hasImage: boolean;
  isCritical?: boolean;
  categoryCode?: string | null;
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
