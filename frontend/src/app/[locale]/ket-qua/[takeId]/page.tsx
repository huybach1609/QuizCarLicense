import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { fetchApi, type GradedQuestion } from "@/lib/api-client";
import { ExamResultStation, type ExamResultData } from "@/components/exam/exam-result-station";

interface TakeDetailData {
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
  questions: GradedQuestion[];
}

export default async function SavedResultPage({
  params,
}: {
  params: Promise<{ locale: string; takeId: string }>;
}) {
  const { locale, takeId } = await params;
  setRequestLocale(locale);

  const { data: take, status } = await fetchApi<TakeDetailData>(`/api/v1/takes/${takeId}`, {
    cache: "no-store",
  });

  if (status === 401) {
    redirect(`/${locale}/dang-nhap`);
  }

  if (!take) {
    notFound();
  }

  const resultData: ExamResultData = {
    takeId: take.takeId,
    quizId: take.quizId,
    quizTitle: take.quizTitle || "Bài thi sát hạch lý thuyết",
    score: take.score ?? 0,
    totalQuestions: take.totalQuestions ?? (take.questions?.length || 30),
    startedAt: take.startedAt,
    finishedAt: take.finishedAt,
    passScore: take.passScore,
    isPassed: take.isPassed,
    hasCriticalError: take.hasCriticalError,
    licenseClassCode: take.licenseClassCode || "B",
    isGuest: false,
    questions: take.questions || [],
  };

  return <ExamResultStation data={resultData} />;
}
