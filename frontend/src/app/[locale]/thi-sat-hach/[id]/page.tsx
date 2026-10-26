import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { fetchApi, type QuizExamDetail } from "@/lib/api-client";
import { ExamEngine } from "@/components/exam/exam-engine";
import { constructSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const { data: quiz } = await fetchApi<QuizExamDetail>(`/api/v1/quizzes/${id}`, {
    cache: "no-store",
  });

  if (!quiz) {
    return { title: "Không tìm thấy đề thi | QuizCarLicense" };
  }

  return constructSeoMetadata({
    title: `Thi thử ${quiz.title} (${quiz.totalQuestions} câu)`,
    description: quiz.detail || "Phòng thi thử lý thuyết sát hạch lái xe trực tuyến chuẩn Bộ GTVT.",
    path: `/thi-sat-hach/${id}`,
    locale,
  });
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const { data: quiz } = await fetchApi<QuizExamDetail>(`/api/v1/quizzes/${id}`, {
    cache: "no-store",
  });

  if (!quiz) {
    notFound();
  }

  return <ExamEngine quiz={quiz} />;
}
