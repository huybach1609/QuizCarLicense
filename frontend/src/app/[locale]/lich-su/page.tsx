import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { fetchApi, type PagedResponse, type TakeHistoryItem } from "@/lib/api-client";
import { History, Eye, CheckCircle2, XCircle, ArrowLeft, AlertTriangle } from "lucide-react";

export default async function HistoryPage({
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
  const pageSize = 10;

  const { data: takesData, status } = await fetchApi<PagedResponse<TakeHistoryItem>>(
    `/api/v1/takes?page=${page}&pageSize=${pageSize}`,
    { cache: "no-store" }
  );

  if (status === 401) {
    redirect(`/${locale}/dang-nhap`);
  }

  const items = takesData?.items || [];
  const totalPages = takesData?.totalPages || 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Lịch Sử Làm Bài</h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-lg flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Bạn chưa có lượt thi nào được lưu.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium"
          >
            Bắt đầu thi thử ngay
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Mã</th>
                  <th className="py-2.5 px-3">Hạng / Bộ đề thi</th>
                  <th className="py-2.5 px-3 text-center">Kết quả</th>
                  <th className="py-2.5 px-3 text-center">Điểm số</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Thời gian thi</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((take) => {
                  const passScore = take.passScore ?? Math.round(take.totalQuestions * 0.9);
                  const isPass =
                    take.isPassed !== undefined
                      ? take.isPassed
                      : take.score >= passScore && !take.hasCriticalError;

                  const dateFormatted = new Date(take.startedAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={take.takeId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-muted-foreground">
                        #{take.takeId}
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground max-w-[240px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate">{take.quizTitle}</span>
                          {take.licenseClassCode && (
                            <span className="text-[10px] text-primary font-bold">
                              Hạng {take.licenseClassCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isPass
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {isPass ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{isPass ? "Đạt" : "Không đạt"}</span>
                          </span>
                          {take.hasCriticalError && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-destructive">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Sai câu điểm liệt</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">
                        {take.score} / {take.totalQuestions}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">
                        {dateFormatted}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/ket-qua/${take.takeId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border/80 text-foreground hover:bg-muted text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>Trang {page} / {totalPages}</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/lich-su?page=${Math.max(1, page - 1)}`}
                  className={`px-2.5 py-1 rounded border border-border text-foreground hover:bg-muted ${
                    page <= 1 ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Trước
                </Link>
                <Link
                  href={`/lich-su?page=${Math.min(totalPages, page + 1)}`}
                  className={`px-2.5 py-1 rounded border border-border text-foreground hover:bg-muted ${
                    page >= totalPages ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Sau
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
