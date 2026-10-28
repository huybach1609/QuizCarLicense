import { fetchApi, type PublicQuestionDetail } from "@/lib/api-client";
import { QuestionDetailModal } from "@/components/question/question-detail-modal";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function InterceptedQuestionDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const { data: question } = await fetchApi<PublicQuestionDetail>(
    `/api/v1/questions/${id}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!question) {
    notFound();
  }

  return <QuestionDetailModal question={question} />;
}