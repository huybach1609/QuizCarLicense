import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { fetchApi, type PublicQuestionDetail } from "@/lib/api-client";
import { constructSeoMetadata, generateQuestionJsonLd } from "@/lib/seo";
import { ArrowLeft, CheckCircle2, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const { data: q } = await fetchApi<PublicQuestionDetail>(`/api/v1/questions/${id}`, {
    next: { revalidate: 3600 },
  });

  if (!q) {
    return { title: "Không tìm thấy câu hỏi | QuizCarLicense" };
  }

  const shortContent = q.content.length > 120 ? `${q.content.substring(0, 120)}...` : q.content;

  return constructSeoMetadata({
    title: `Câu hỏi ${q.questionId}: ${shortContent}`,
    description: `Xem đáp án chính xác và giải thích chi tiết cho câu hỏi số ${q.questionId} trong bộ 600 câu sát hạch lái xe.`,
    path: `/cau-hoi/${id}`,
    locale,
  });
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const { data: question } = await fetchApi<PublicQuestionDetail>(`/api/v1/questions/${id}`, {
    next: { revalidate: 3600 },
  });

  if (!question) {
    notFound();
  }

  const jsonLd = generateQuestionJsonLd(question);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6 w-full">
      {/* Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <Link
          href="/cau-hoi"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh mục 600 câu hỏi</span>
        </Link>
        <span className="font-mono text-xs font-semibold text-primary">
          CÂU HỎI #{question.questionId}
        </span>
      </div>

      <article className="p-6 rounded-lg border border-border/80 bg-card flex flex-col gap-5">
        <h1 className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
          {question.content}
        </h1>

        {question.image && question.image !== "none" && (
          <div className="relative w-full max-w-md h-52 sm:h-64 mx-auto rounded-md border border-border overflow-hidden bg-muted/20">
            <Image
              src={question.image}
              alt={`Hình minh họa câu hỏi ${question.questionId}`}
              fill
              className="object-contain"
              priority
            />
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {question.answers.map((ans, idx) => {
            const letter = String.fromCharCode(65 + idx);

            return (
              <div
                key={ans.id}
                id={`answer-${ans.id}`}
                className={`flex items-start gap-3 p-3 rounded-md text-xs sm:text-sm border transition-colors ${
                  ans.isCorrect
                    ? "bg-primary/10 border-primary/50 text-foreground font-medium"
                    : "border-border/60 text-muted-foreground bg-muted/20"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold shrink-0 ${
                    ans.isCorrect
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border/60"
                  }`}
                >
                  {letter}
                </span>
                <span className="leading-relaxed pt-0.5">{ans.content}</span>
                {ans.isCorrect && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đáp án đúng</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Các bộ đề có câu hỏi này */}
        {question.inQuizzes && question.inQuizzes.length > 0 && (
          <div className="pt-4 border-t border-border/50 flex flex-col gap-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>Có trong các bộ đề thi:</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {question.inQuizzes.map((title, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full border border-border bg-muted/50 text-[11px]"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
