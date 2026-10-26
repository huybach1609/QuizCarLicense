import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { fetchApi, type QuizExamDetail } from "@/lib/api-client";
import { ExamEngine } from "@/components/exam/exam-engine";
import { constructSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ licenseCode?: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const { licenseCode } = (await searchParams) || {};
  const query = licenseCode ? `?licenseCode=${encodeURIComponent(licenseCode)}` : "";

  const { data: quiz } = await fetchApi<QuizExamDetail>(`/api/v1/quizzes/${id}${query}`, {
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
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ licenseCode?: string }>;
}) {
  const { locale, id } = await params;
  const { licenseCode } = (await searchParams) || {};
  setRequestLocale(locale);

  const query = licenseCode ? `?licenseCode=${encodeURIComponent(licenseCode)}` : "";
  const { data: quiz } = await fetchApi<QuizExamDetail>(`/api/v1/quizzes/${id}${query}`, {
    cache: "no-store",
  });

  if (!quiz) {
    notFound();
  }

  return <ExamEngine quiz={quiz} />;
}
