import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { fetchApi, type PublicQuestionDetail } from "@/lib/api-client";
import {
  constructSeoMetadata,
  generateQuestionJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
} from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const { data: q } = await fetchApi<PublicQuestionDetail>(
    `/api/v1/questions/${id}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!q) {
    return { title: "Không tìm thấy câu hỏi | QuizCarLicense" };
  }

  const shortContent =
    q.content.length > 100 ? `${q.content.substring(0, 100)}...` : q.content;
  const prefix = q.isCritical ? "[ĐIỂM LIỆT] " : "";
  const title = `${prefix}Câu hỏi ${q.questionId}: ${shortContent}`;

  const description = q.explanation
    ? `Đáp án chuẩn và giải thích chi tiết câu hỏi số ${q.questionId}: "${shortContent}". Mẹo: ${q.explanation}`
    : `Xem đáp án chính xác và phân tích câu hỏi số ${q.questionId} trong bộ 600 câu sát hạch lái xe mới nhất của Bộ GTVT.`;

  const ogImage =
    q.image && q.image !== "none" ? q.image : "/og-image.png";

  return constructSeoMetadata({
    title,
    description,
    path: `/cau-hoi/${id}`,
    locale,
    ogImage,
  });
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const { data: question } = await fetchApi<PublicQuestionDetail>(
    `/api/v1/questions/${id}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!question) {
    notFound();
  }

  // Schema Structured Data
  const questionLd = generateQuestionJsonLd({
    questionId: question.questionId,
    content: question.content,
    image: question.image,
    explanation: question.explanation,
    answers: question.answers,
  });

  const breadcrumbs = [
    { name: "Trang chủ", path: "/" },
    { name: "Ngân hàng 600 câu hỏi", path: "/cau-hoi" },
  ];

  if (question.categoryCode && question.categoryTitle) {
    breadcrumbs.push({
      name: question.categoryTitle,
      path: `/cau-hoi?category=${question.categoryCode}`,
    });
  }

  breadcrumbs.push({
    name: `Câu hỏi #${question.questionId}`,
    path: `/cau-hoi/${question.questionId}`,
  });

  const breadcrumbLd = generateBreadcrumbJsonLd(breadcrumbs);

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbLd, questionLd],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 w-full select-none">
      {/* Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      {/* 1. Breadcrumb Console */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground flex-wrap"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          TRANG CHỦ
        </Link>
        <span>/</span>
        <Link href="/cau-hoi" className="hover:text-foreground transition-colors">
          NGÂN HÀNG CÂU HỎI
        </Link>
        {question.categoryTitle && (
          <>
            <span>/</span>
            <Link
              href={`/cau-hoi?category=${question.categoryCode || ""}`}
              className="hover:text-foreground transition-colors text-primary font-medium"
            >
              {question.categoryTitle.toUpperCase()}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-bold">
          CÂU #{question.questionId.toString().padStart(3, "0")}
        </span>
      </nav>

      {/* 2. Top Navigation Bar (Back + Sequential Prev / Next) */}
      <div className="border border-border bg-card p-2.5 sm:px-4 flex items-center justify-between gap-3 font-mono text-xs">
        <Button
          size="sm"
          variant="ghost"
          render={<Link href="/cau-hoi" />}
          nativeButton={false}
          className="h-7 gap-1 px-2 text-xs rounded-none cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft data-icon="inline-start" className="size-3" />
          <span className="hidden sm:inline">Về danh mục 600 câu</span>
          <span className="sm:hidden">Danh mục</span>
        </Button>

        {/* Doubly-Linked Sequential Crawl Links */}
        <div className="flex items-center gap-1.5">
          {question.prevQuestionId ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/cau-hoi/${question.prevQuestionId}`} />}
              nativeButton={false}
              className="h-7 px-2.5 text-xs font-mono rounded-none cursor-pointer"
              title={`Xem câu hỏi #${question.prevQuestionId}`}
            >
              <ChevronLeft data-icon="inline-start" className="size-3" />
              <span>Câu trước</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="h-7 px-2.5 text-xs font-mono rounded-none opacity-40 pointer-events-none"
            >
              <ChevronLeft data-icon="inline-start" className="size-3" />
              <span>Câu trước</span>
            </Button>
          )}

          <span className="text-primary font-bold px-1 tabular-nums">
            #{question.questionId}
          </span>

          {question.nextQuestionId ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/cau-hoi/${question.nextQuestionId}`} />}
              nativeButton={false}
              className="h-7 px-2.5 text-xs font-mono rounded-none cursor-pointer"
              title={`Xem câu hỏi #${question.nextQuestionId}`}
            >
              <span>Câu sau</span>
              <ChevronRight data-icon="inline-end" className="size-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="h-7 px-2.5 text-xs font-mono rounded-none opacity-40 pointer-events-none"
            >
              <span>Câu sau</span>
              <ChevronRight data-icon="inline-end" className="size-3" />
            </Button>
          )}
        </div>
      </div>



      {/* 4. Main Question Card */}
      <article className="border border-border bg-card p-4 sm:p-6 flex flex-col gap-5">
        {/* Meta badges row */}
        <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3 flex-wrap font-mono text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 border border-primary/40 bg-primary/10 text-primary font-bold text-xs">
              CÂU #{question.questionId.toString().padStart(3, "0")}
            </span>
            {question.categoryTitle && (
              <Badge variant="outline" className="rounded-none border-border font-mono text-xs">
                {question.categoryTitle}
              </Badge>
            )}
            {question.isCritical && (
              <Badge variant="destructive" className="rounded-none font-mono text-xs uppercase">
                ĐIỂM LIỆT
              </Badge>
            )}
          </div>

          <span className="text-[11px] text-muted-foreground font-mono">
            ĐIỂM SỐ: <strong>{question.score} ĐIỂM</strong>
          </span>
        </div>

        {/* Question Content (H1 for SEO) */}
        <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground leading-relaxed font-sans">
          {question.content}
        </h1>

        {/* Diagram / Traffic Sign Image (If present) */}
        {question.image && question.image !== "none" && (
          <div className="flex flex-col items-center gap-2 my-2">
            <div className="relative w-full max-w-lg h-56 sm:h-72 border border-border overflow-hidden bg-background/50 flex items-center justify-center p-2">
              <Image
                src={question.image}
                alt={`Hình ảnh biển báo sa hình minh họa câu hỏi số ${question.questionId} sát hạch lái xe`}
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {"//"} HÌNH MINH HỌA CÂU HỎI #{question.questionId}
            </span>
          </div>
        )}

        {/* Answers List */}
        <div className="flex flex-col gap-2 pt-2">
          <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
            LỰA CHỌN ĐÁP ÁN:
          </span>

          {question.answers.map((ans, idx) => {
            const letter = String.fromCharCode(65 + idx);

            return (
              <div
                key={ans.id}
                id={`answer-${ans.id}`}
                className={`flex items-start gap-3 p-3.5 border transition-all text-xs sm:text-sm ${
                  ans.isCorrect
                    ? "bg-primary/10 border-primary text-foreground font-medium"
                    : "border-border bg-background/60 text-muted-foreground"
                }`}
              >
                <span
                  className={`size-6 flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${
                    ans.isCorrect
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {letter}
                </span>

                <span className="leading-relaxed font-sans pt-0.5 flex-1">
                  {ans.content}
                </span>

                {ans.isCorrect && (
                  <Badge
                    variant="default"
                    className="ml-auto text-[10px] font-mono uppercase rounded-none shrink-0"
                  >
                    <CheckCircle2 className="size-3 mr-1" />
                    <span>ĐÁP ÁN ĐÚNG</span>
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation & Memory Tip Callout */}
        {question.explanation && (
          <Alert variant="default" className="rounded-none border-primary/40 bg-primary/5 mt-2 font-sans">
            <Lightbulb className="size-4 text-primary" />
            <AlertTitle className="font-mono text-xs font-bold uppercase text-primary tracking-wider">
              GIẢI THÍCH ĐÁP ÁN & MẸO GHI NHỚ
            </AlertTitle>
            <AlertDescription className="text-xs text-foreground/90 leading-relaxed mt-1 font-sans">
              {question.explanation}
            </AlertDescription>
          </Alert>
        )}

        {/* Associated Quizzes */}
        {question.inQuizzes && question.inQuizzes.length > 0 && (
          <div className="pt-4 border-t border-border flex flex-col gap-2 text-xs font-mono">
            <span className="font-bold text-foreground flex items-center gap-1.5 uppercase">
              <BookOpen className="size-3.5 text-primary" />
              <span>CÂU HỎI XUẤT HIỆN TRONG CÁC BỘ ĐỀ THI:</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {question.inQuizzes.map((title, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 border border-border bg-muted/60 text-muted-foreground text-[11px]"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* 5. Related Questions Cluster (Topical Authority & Link Equity) */}
      {question.relatedQuestions && question.relatedQuestions.length > 0 && (
        <section className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-0.5">
            <h2 className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileQuestion className="size-3.5 text-primary" />
              <span>
                {"//"} CÂU HỎI LIÊN QUAN {question.categoryTitle ? `(${question.categoryTitle.toUpperCase()})` : ""}
              </span>
            </h2>
            <Link
              href={question.categoryCode ? `/cau-hoi?category=${question.categoryCode}` : "/cau-hoi"}
              className="text-primary hover:underline"
            >
              Xem tất cả &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.relatedQuestions.map((rq) => (
              <Link
                key={rq.questionId}
                href={`/cau-hoi/${rq.questionId}`}
                className="group p-3 border border-border bg-card hover:border-primary/60 hover:bg-muted/30 transition-all flex flex-col justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-primary tabular-nums shrink-0 pt-0.5">
                    #{rq.questionId.toString().padStart(3, "0")}
                  </span>
                  <p className="text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed font-sans">
                    {rq.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50">
                  {rq.isCritical ? (
                    <span className="text-destructive font-bold uppercase">
                      ĐIỂM LIỆT
                    </span>
                  ) : (
                    <span>LÝ THUYẾT</span>
                  )}
                  <span className="inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                    <span>Xem đáp án</span>
                    <ArrowRight className="size-2.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Bottom Sticky / Secondary Navigation */}
      <div className="border border-border bg-card p-3 flex items-center justify-between gap-3 font-mono text-xs">
        <Button
          size="sm"
          variant="outline"
          render={<Link href="/cau-hoi" />}
          nativeButton={false}
          className="h-8 gap-1.5 px-3 rounded-none cursor-pointer"
        >
          <ArrowLeft data-icon="inline-start" className="size-3" />
          <span>Danh mục 600 câu</span>
        </Button>

        <div className="flex items-center gap-2">
          {question.prevQuestionId && (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/cau-hoi/${question.prevQuestionId}`} />}
              nativeButton={false}
              className="h-8 px-3 rounded-none cursor-pointer"
            >
              <span>&larr; Câu #{question.prevQuestionId}</span>
            </Button>
          )}
          {question.nextQuestionId && (
            <Button
              size="sm"
              variant="default"
              render={<Link href={`/cau-hoi/${question.nextQuestionId}`} />}
              nativeButton={false}
              className="h-8 px-3 rounded-none cursor-pointer"
            >
              <span>Câu #{question.nextQuestionId} &rarr;</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}