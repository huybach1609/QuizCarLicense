import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { fetchApi, type PagedResponse, type PublicQuestionItem } from "@/lib/api-client";
import { BookOpen, ArrowRight, Image as ImageIcon } from "lucide-react";
import { constructSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return constructSeoMetadata({
    title: "Ngân Hàng 600 Câu Hỏi Lý Thuyết Sát Hạch Lái Xe Ô Tô & Mô Tô",
    description: "Tra cứu toàn bộ 600 câu hỏi sát hạch lý thuyết lái xe mới nhất của Bộ Giao thông Vận tải kèm đáp án chính xác.",
    path: "/cau-hoi",
    locale,
  });
}

export default async function QuestionsCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageStr } = await searchParams;
  setRequestLocale(locale);

  const page = parseInt(pageStr || "1", 10);
  const pageSize = 30;

  const { data: questionData } = await fetchApi<PagedResponse<PublicQuestionItem>>(
    `/api/v1/questions?page=${page}&pageSize=${pageSize}`,
    { next: { revalidate: 3600 } }
  );

  const items = questionData?.items || [];
  const totalPages = questionData?.totalPages || 1;
  const totalCount = questionData?.totalCount || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 w-full">
      <div className="border-b border-border/70 pb-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Ngân Hàng 600 Câu Hỏi Sát Hạch
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Tổng hợp toàn bộ {totalCount} câu hỏi lý thuyết kèm hình ảnh biển báo và sa hình chuẩn.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((q) => (
          <Link
            key={q.questionId}
            href={`/cau-hoi/${q.questionId}`}
            className="group p-3.5 rounded-lg border border-border/70 bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs font-bold text-primary tabular-nums shrink-0 pt-0.5">
                #{q.questionId.toString().padStart(3, "0")}
              </span>
              <p className="text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                {q.content}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
              {q.hasImage && (
                <span title="Có hình ảnh minh họa">
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                </span>
              )}
              <ArrowRight className="w-3.5 h-3.5 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <span>Trang {page} / {totalPages} ({totalCount} câu)</span>
          <div className="flex items-center gap-2">
            <Link
              href={`/cau-hoi?page=${Math.max(1, page - 1)}`}
              className={`px-3 py-1 rounded border border-border text-foreground hover:bg-muted ${
                page <= 1 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Trước
            </Link>
            <Link
              href={`/cau-hoi?page=${Math.min(totalPages, page + 1)}`}
              className={`px-3 py-1 rounded border border-border text-foreground hover:bg-muted ${
                page >= totalPages ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Sau
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
