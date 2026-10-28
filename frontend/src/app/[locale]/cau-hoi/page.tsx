import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  fetchApi,
  type PagedResponse,
  type PublicQuestionItem,
  type QuestionCategory,
} from "@/lib/api-client";
import {
  constructSeoMetadata,
  generateBreadcrumbJsonLd,
  generateQuestionCatalogJsonLd,
  generateFaqJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BarcodeStrip,
  FrequencyRuler,
} from "@/components/telemetry/telemetry-primitives";
import {
  BookOpen,
  ArrowRight,
  Image as ImageIcon,
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  HelpCircle,
  FileQuestion,
  Info,
} from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    critical?: string;
    q?: string;
  }>;
}

const FAQS = [
  {
    question: "Bộ 600 câu hỏi thi sát hạch lý thuyết lái xe gồm những phần nào?",
    answer:
      "Bộ đề 600 câu hỏi do Cục CSGT và Bộ GTVT ban hành gồm 6 chương: Chương 1: Quy tắc giao thông đường bộ (166 câu); Chương 2: Nghiệp vụ vận tải (26 câu); Chương 3: Văn hóa & đạo đức lái xe (21 câu); Chương 4: Kỹ thuật lái xe (56 câu); Chương 5: Cấu tạo & sửa chữa ô tô (35 câu); Chương 6: Biển báo hiệu đường bộ (182 câu); và Giải các thế sa hình (114 câu).",
  },
  {
    question: "Câu hỏi điểm liệt là gì và có bao nhiêu câu điểm liệt?",
    answer:
      "Có tổng cộng 60 câu hỏi điểm liệt là các tình huống mất an toàn giao thông nghiêm trọng (uống rượu bia, đua xe, vượt đường tàu, dừng đỗ trên cao tốc...). Trong kỳ thi sát hạch, thí sinh trả lời SAI DÙ CHỈ 1 CÂU ĐIỂM LIỆT sẽ bị truất quyền sát hạch (đánh trượt trực tiếp), bất kể tổng điểm các câu khác có đạt.",
  },
  {
    question: "Bộ câu hỏi này áp dụng cho các hạng giấy phép lái xe nào?",
    answer:
      "Bộ câu hỏi chuẩn hóa áp dụng cho toàn bộ 11 hạng giấy phép lái xe theo Thông tư 108/2026/TT-BCA: Hạng A1, A (mô tô); Hạng B, C1, C, D1, D2, D, BE, C1E, CE (ô tô và xe chuyên dùng). Mỗi hạng sẽ được rút số lượng câu hỏi và thời gian thi tương ứng từ ngân hàng 600 câu.",
  },
  {
    question: "Làm thế nào để học và ghi nhớ nhanh 600 câu hỏi sát hạch?",
    answer:
      "Nên học lần lượt theo từng chương: trước hết nắm chắc 60 câu điểm liệt, sau đó học quy tắc chung, hệ thống biển báo theo nhóm (cấm, nguy hiểm, hiệu lệnh, chỉ dẫn) và áp dụng nguyên tắc thứ tự ưu tiên khi giải sa hình (Xe trong giao lộ -> Xe ưu tiên -> Đường ưu tiên -> Quyền bên phải -> Hướng rẽ).",
  },
];

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const { page: pageStr, category, critical, q } = await searchParams;

  const page = parseInt(pageStr || "1", 10);
  const isCritical = critical === "true";
  const hasQuery = Boolean(q?.trim());

  let title = "Ngân Hàng 600 Câu Hỏi Lý Thuyết Sát Hạch Lái Xe Ô Tô & Mô Tô";
  let description =
    "Tra cứu trọn bộ 600 câu hỏi sát hạch lý thuyết lái xe mới nhất của Bộ GTVT kèm đáp án chính xác, giải thích chi tiết, 60 câu điểm liệt, biển báo và sa hình.";

  if (hasQuery) {
    title = `Tìm kiếm câu hỏi: "${q!.trim()}"`;
    description = `Kết quả tìm kiếm câu hỏi sát hạch lý thuyết lái xe cho từ khóa "${q!.trim()}".`;
  } else if (isCritical) {
    title = "Trọn Bộ 60 Câu Hỏi Điểm Liệt Sát Hạch Lái Xe (Có Đáp Án & Giải Thích)";
    description =
      "Tổng hợp 60 câu hỏi điểm liệt sát hạch lái xe B, C, A1 bắt buộc phải trả lời đúng. Sai 1 câu trượt trực tiếp, có hướng dẫn mẹo nhớ và phân tích chi tiết.";
  } else if (category) {
    title = `Câu Hỏi Sát Hạch Lý Thuyết Lái Xe - Chuyên Đề ${category.toUpperCase()}`;
    description = `Danh sách câu hỏi chuyên đề ${category.toUpperCase()} trong bộ 600 câu hỏi sát hạch lý thuyết lái xe mới nhất.`;
  }

  const pageSuffix = page > 1 ? ` - Trang ${page}` : "";
  title = `${title}${pageSuffix}`;

  // Build canonical path
  const paramsList: string[] = [];
  if (category) paramsList.push(`category=${encodeURIComponent(category)}`);
  if (isCritical) paramsList.push("critical=true");
  if (page > 1) paramsList.push(`page=${page}`);
  const queryString = paramsList.length > 0 ? `?${paramsList.join("&")}` : "";
  const canonicalPath = `/cau-hoi${queryString}`;

  return constructSeoMetadata({
    title,
    description,
    path: canonicalPath,
    locale,
    noIndex: hasQuery, // Noindex query search result pages to avoid thin spam index
  });
}

function getPaginationRange(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default async function QuestionsCatalogPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { page: pageStr, category, critical, q } = await searchParams;
  setRequestLocale(locale);

  const page = Math.max(1, parseInt(pageStr || "1", 10));
  const pageSize = 30;
  const isCritical = critical === "true";
  const searchQuery = q?.trim() || "";

  // Build query string for API
  const queryParts = [`page=${page}`, `pageSize=${pageSize}`];
  if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
  if (isCritical) queryParts.push("critical=true");
  if (searchQuery) queryParts.push(`q=${encodeURIComponent(searchQuery)}`);

  const [questionRes, categoriesRes] = await Promise.all([
    fetchApi<PagedResponse<PublicQuestionItem>>(
      `/api/v1/questions?${queryParts.join("&")}`,
      { next: { revalidate: 3600 } }
    ),
    fetchApi<QuestionCategory[]>("/api/v1/license-classes/categories", {
      next: { revalidate: 86400 },
    }),
  ]);

  const questionData = questionRes.data;
  const categories = categoriesRes.data || [];
  const items = questionData?.items || [];
  const totalPages = questionData?.totalPages || 1;
  const totalCount = questionData?.totalCount || 0;

  // Structured Data (JSON-LD)
  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    { name: "Ngân hàng 600 câu hỏi", path: "/cau-hoi" },
  ]);

  const catalogLd = generateQuestionCatalogJsonLd({
    items,
    page,
    pageSize,
    totalCount,
    path: `/cau-hoi?${queryParts.join("&")}`,
  });

  const faqLd = generateFaqJsonLd(FAQS);

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbLd,
      catalogLd,
      ...(page === 1 && !searchQuery ? [faqLd] : []),
    ],
  };

  // Helper to build URL for filtering
  const makeFilterUrl = (opts: {
    cat?: string | null;
    crit?: boolean | null;
    pageNum?: number;
  }) => {
    const parts: string[] = [];
    const targetCat = opts.cat !== undefined ? opts.cat : category;
    const targetCrit = opts.crit !== undefined ? opts.crit : isCritical;
    const targetPage = opts.pageNum !== undefined ? opts.pageNum : 1;

    if (targetCat) parts.push(`category=${encodeURIComponent(targetCat)}`);
    if (targetCrit) parts.push("critical=true");
    if (targetPage > 1) parts.push(`page=${targetPage}`);

    return parts.length > 0 ? `/cau-hoi?${parts.join("&")}` : "/cau-hoi";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 w-full select-none">
      {/* Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      {/* 1. Breadcrumb Console */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          TRANG CHỦ
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">NGÂN HÀNG CÂU HỎI</span>
        {isCritical && (
          <>
            <span>/</span>
            <span className="text-destructive font-bold">60 CÂU ĐIỂM LIỆT</span>
          </>
        )}
        {category && (
          <>
            <span>/</span>
            <span className="text-primary font-bold">CHUYÊN ĐỀ {category}</span>
          </>
        )}
        {page > 1 && (
          <>
            <span>/</span>
            <span className="text-muted-foreground">TRANG {page}</span>
          </>
        )}
      </nav>

      {/* 2. Cockpit Header Console */}
      <header className="border border-border bg-card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="size-8 border border-primary/40 bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BookOpen className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-base sm:text-xl font-bold font-mono tracking-tight text-foreground uppercase">
                {isCritical
                  ? "Bộ 60 Câu Hỏi Điểm Liệt Sát Hạch Lái Xe"
                  : "Ngân Hàng 600 Câu Hỏi Sát Hạch Lái Xe"}
              </h1>
              <span className="text-xs text-muted-foreground font-sans">
                Bộ đề chuẩn Cục CSGT & Bộ GTVT • Cập nhật Thông tư 108/2026/TT-BCA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center font-mono">
            <BarcodeStrip height={12} bars={[2, 1, 3, 1, 2, 1, 4]} className="text-primary hidden sm:block" />
            <Badge variant="outline" className="font-mono text-xs rounded-none border-border">
              {totalCount} CÂU HIỂN THỊ
            </Badge>
          </div>
        </div>

        {/* 4-Instrument Quick Telemetry Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="p-2.5 bg-background/80 border border-border flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase">TỔNG QUY CHUẨN</span>
            <span className="text-sm sm:text-base font-extrabold text-foreground tabular-nums">
              600 <span className="text-xs font-normal text-muted-foreground">câu</span>
            </span>
          </div>

          <div className="p-2.5 bg-destructive/10 border border-destructive/30 flex flex-col gap-0.5">
            <span className="text-[10px] text-destructive uppercase font-bold">CÂU ĐIỂM LIỆT</span>
            <span className="text-sm sm:text-base font-extrabold text-destructive tabular-nums">
              60 <span className="text-xs font-normal opacity-80">câu</span>
            </span>
          </div>

          <div className="p-2.5 bg-background/80 border border-border flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase">CHƯƠNG KIẾN THỨC</span>
            <span className="text-sm sm:text-base font-extrabold text-foreground tabular-nums">
              06 <span className="text-xs font-normal text-muted-foreground">chương</span>
            </span>
          </div>

          <div className="p-2.5 bg-primary/10 border border-primary/30 flex flex-col gap-0.5">
            <span className="text-[10px] text-primary uppercase font-bold">QUY ĐỊNH THI</span>
            <span className="text-sm sm:text-base font-extrabold text-primary">
              11 HẠNG GPLX
            </span>
          </div>
        </div>
      </header>

      {/* 3. Category & Hazard Filter Hub + Search Box */}
      <section aria-label="Bộ lọc chuyên đề" className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-0.5">
          <span className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            <span>{"//"} BỘ LỌC CHUYÊN ĐỀ & TÌM KIẾM</span>
          </span>
          <FrequencyRuler count={16} className="hidden sm:flex" />
        </div>

        {/* Filter Strip with Base UI Button Links */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-card border border-border">
          {/* All Questions */}
          <Button
            size="sm"
            variant={!isCritical && !category ? "default" : "outline"}
            render={<Link href="/cau-hoi" />}
            nativeButton={false}
            className="h-7 text-xs font-mono font-medium rounded-none cursor-pointer"
          >
            TẤT CẢ (600)
          </Button>

          {/* 60 Critical Questions Hazard Filter */}
          <Button
            size="sm"
            variant={isCritical ? "destructive" : "outline"}
            render={<Link href={makeFilterUrl({ crit: !isCritical, cat: null })} />}
            nativeButton={false}
            className={`h-7 text-xs font-mono font-medium rounded-none cursor-pointer ${
              !isCritical
                ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                : ""
            }`}
          >
            <ShieldAlert data-icon="inline-start" className="size-3" />
            <span>60 CÂU ĐIỂM LIỆT</span>
          </Button>

          {/* Chapters 1 to 6 */}
          {categories.map((cat, idx) => {
            const isSelected = category === cat.code;
            const chapterNum = idx + 1;

            return (
              <Button
                key={cat.categoryId}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                render={
                  <Link
                    href={makeFilterUrl({
                      cat: isSelected ? null : cat.code,
                      crit: false,
                    })}
                  />
                }
                nativeButton={false}
                className="h-7 text-xs font-mono font-medium rounded-none cursor-pointer"
              >
                <span>
                  CH{chapterNum} ({cat.questionCount})
                </span>
              </Button>
            );
          })}
        </div>

        {/* SSR Search Bar */}
        <form
          action="/cau-hoi"
          method="GET"
          className="flex items-center gap-2 p-1.5 bg-card border border-border"
        >
          {category && <input type="hidden" name="category" value={category} />}
          {isCritical && <input type="hidden" name="critical" value="true" />}
          <div className="relative flex-1">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={searchQuery}
              placeholder="Tìm kiếm theo từ khóa hoặc số câu (VD: đường cao tốc, biển báo, 120...)"
              className="pl-8 text-xs font-sans h-8 rounded-none border-border"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 px-3 font-mono text-xs uppercase font-bold rounded-none cursor-pointer"
          >
            Tìm kiếm
          </Button>
          {(searchQuery || category || isCritical) && (
            <Button
              size="sm"
              variant="ghost"
              render={<Link href="/cau-hoi" />}
              nativeButton={false}
              className="h-8 px-2.5 font-mono text-xs rounded-none cursor-pointer"
            >
              Đặt lại
            </Button>
          )}
        </form>
      </section>

      {/* 4. Question Items List */}
      <section
        aria-labelledby="question-list-heading"
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-0.5">
          <h2
            id="question-list-heading"
            className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"
          >
            <FileQuestion className="size-3.5 text-primary" />
            <span>
              {"//"} DANH SÁCH CÂU HỎI (TRANG {page}/{totalPages})
            </span>
          </h2>
          <span className="hidden sm:inline">
            TỔNG CỘNG: {totalCount} CÂU HỎI
          </span>
        </div>

        {items.length > 0 ? (
          <div className="border border-border bg-card divide-y divide-border/70 overflow-hidden">
            {items.map((q) => (
              <Link
                key={q.questionId}
                href={`/cau-hoi/${q.questionId}`}
                className="group p-3.5 sm:p-4 flex items-start justify-between gap-4 transition-all duration-150 hover:bg-muted/40 border-l-2 border-l-transparent hover:border-l-primary active:bg-muted/60"
              >
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  {/* Question ID Indicator */}
                  <span className="font-mono text-xs sm:text-sm font-bold text-primary tabular-nums shrink-0 pt-0.5 w-12">
                    #{q.questionId.toString().padStart(3, "0")}
                  </span>

                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors leading-relaxed font-sans">
                      {q.content}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                      {q.isCritical && (
                        <Badge
                          variant="destructive"
                          className="font-mono text-[10px] rounded-none px-1.5 py-0 uppercase"
                        >
                          <ShieldAlert className="size-2.5 mr-1" />
                          <span>ĐIỂM LIỆT</span>
                        </Badge>
                      )}

                      {q.categoryTitle && (
                        <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 border border-border/60 text-[10px]">
                          {q.categoryTitle}
                        </span>
                      )}

                      {q.hasImage && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground text-[10px]">
                          <ImageIcon className="size-3" />
                          <span>Có hình</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1 text-muted-foreground">
                  <ArrowRight className="size-3.5 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border bg-card/40 text-center font-mono text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Info className="size-5 text-muted-foreground/60" />
            <span>{"// KHÔNG TÌM THẤY CÂU HỎI PHÙ HỢP VỚI ĐIỀU KIỆN LỌC."}</span>
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/cau-hoi" />}
              nativeButton={false}
              className="mt-2 text-xs font-mono rounded-none"
            >
              Về danh mục gốc
            </Button>
          </div>
        )}
      </section>

      {/* 5. Numbered Pagination Console (Reduces crawl depth from 20 clicks to 1-2 hops) */}
      {totalPages > 1 && (
        <nav
          aria-label="Phân trang câu hỏi"
          className="border border-border bg-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono"
        >
          <span className="text-muted-foreground">
            TRANG <strong className="text-foreground">{page}</strong> / {totalPages} (
            {totalCount} CÂU)
          </span>

          <div className="flex items-center gap-1 flex-wrap">
            {/* Prev Button */}
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              render={
                <Link
                  href={makeFilterUrl({ pageNum: Math.max(1, page - 1) })}
                  aria-label="Trang trước"
                />
              }
              nativeButton={false}
              className={`h-7 px-2 font-mono text-xs rounded-none cursor-pointer ${
                page <= 1 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <ChevronLeft data-icon="inline-start" className="size-3" />
              <span>Trước</span>
            </Button>

            {/* Numbered Page Buttons */}
            {getPaginationRange(page, totalPages).map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-muted-foreground select-none"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = p as number;
              const isCurrent = pageNum === page;

              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={isCurrent ? "default" : "outline"}
                  render={<Link href={makeFilterUrl({ pageNum })} />}
                  nativeButton={false}
                  className="size-7 p-0 font-mono text-xs rounded-none cursor-pointer"
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {pageNum}
                </Button>
              );
            })}

            {/* Next Button */}
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              render={
                <Link
                  href={makeFilterUrl({ pageNum: Math.min(totalPages, page + 1) })}
                  aria-label="Trang sau"
                />
              }
              nativeButton={false}
              className={`h-7 px-2 font-mono text-xs rounded-none cursor-pointer ${
                page >= totalPages ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <span>Sau</span>
              <ChevronRight data-icon="inline-end" className="size-3" />
            </Button>
          </div>
        </nav>
      )}

      {/* 6. Semantic Content & Topical Guide (Prevents Thin Content & Boosts Keyword Coverage) */}
      <section className="flex flex-col gap-4 pt-4 border-t border-border">
        <div className="flex flex-col gap-1">
          <h2 className="text-base sm:text-lg font-bold text-foreground font-mono uppercase">
            Cấu Trúc Bộ 600 Câu Hỏi Lý Thuyết Sát Hạch Lái Xe Mới Nhất
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bộ tài liệu ôn thi giấy phép lái xe ô tô và mô tô toàn quốc được Cục CSGT và Bộ GTVT chuẩn hóa
            thành 6 chương kiến thức cốt lõi. Hiểu rõ cấu trúc từng phần giúp bạn lập kế hoạch ôn tập hiệu quả:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-xs">
          <div className="border border-border bg-card p-3 flex flex-col gap-1">
            <span className="font-bold text-primary uppercase">CHƯƠNG 1 (166 CÂU)</span>
            <span className="text-[11px] font-sans text-muted-foreground">
              Quy tắc giao thông đường bộ, khái niệm tốc độ, khoảng cách an toàn, nồng độ cồn và tín hiệu đèn.
            </span>
          </div>

          <div className="border border-border bg-card p-3 flex flex-col gap-1">
            <span className="font-bold text-primary uppercase">CHƯƠNG 2 (26 CÂU)</span>
            <span className="text-[11px] font-sans text-muted-foreground">
              Nghiệp vụ vận tải hàng hóa và hành khách, thời gian lái xe an toàn, trách nhiệm tài xế.
            </span>
          </div>

          <div className="border border-border bg-card p-3 flex flex-col gap-1">
            <span className="font-bold text-primary uppercase">CHƯƠNG 3 (21 CÂU)</span>
            <span className="text-[11px] font-sans text-muted-foreground">
              Văn hóa giao thông, đạo đức người lái xe và kỹ năng sơ cứu nạn nhân tai nạn giao thông ban đầu.
            </span>
          </div>

          <div className="border border-border bg-card p-3 flex flex-col gap-1">
            <span className="font-bold text-primary uppercase">CHƯƠNG 4 (56 CÂU)</span>
            <span className="text-[11px] font-sans text-muted-foreground">
              Kỹ thuật lái xe ô tô an toàn khi lên xuống dốc, đường trơn trượt, ban đêm và sương mù.
            </span>
          </div>

          <div className="border border-border bg-card p-3 flex flex-col gap-1">
            <span className="font-bold text-primary uppercase">CHƯƠNG 5 (35 CÂU)</span>
            <span className="text-[11px] font-sans text-muted-foreground">
              Cấu tạo động cơ, hệ thống phanh, lốp xe và phương pháp khắc phục hư hỏng thông thường.
            </span>
          </div>

          <div className="border border-border bg-card p-3 flex flex-col gap-1">
            <span className="font-bold text-primary uppercase">CHƯƠNG 6 (296 CÂU)</span>
            <span className="text-[11px] font-sans text-muted-foreground">
              182 câu hệ thống biển báo hiệu đường bộ và 114 câu giải các thế sa hình xử lý tình huống thực tế.
            </span>
          </div>
        </div>

        {/* Critical Rule Alert */}
        <Alert variant="destructive" className="rounded-none border-destructive/40 bg-destructive/5 font-sans">
          <ShieldAlert className="size-4" />
          <AlertTitle className="font-mono text-xs font-bold uppercase text-destructive">
            Quy Định Về 60 Câu Hỏi Điểm Liệt
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
            Trong đề thi chính thức, mỗi đề thi chứa từ <strong>1 đến 2 câu điểm liệt</strong>. Đây là các câu hỏi về hành vi bị nghiêm cấm hoặc tình huống nguy hiểm chết người. Nếu chọn sai đáp án câu điểm liệt, hệ thống sẽ tự động chấm <strong>KHÔNG ĐẠT</strong> ngay lập tức.
          </AlertDescription>
        </Alert>

        {/* FAQ Section */}
        <div className="flex flex-col gap-3 pt-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-4 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-foreground font-mono uppercase">
              Câu Hỏi Thường Gặp Khi Ôn Tập 600 Câu Lý Thuyết
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FAQS.map((faq, idx) => (
              <Card key={idx} className="rounded-none border-border bg-card">
                <CardHeader className="p-3.5 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-semibold font-sans text-foreground">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}