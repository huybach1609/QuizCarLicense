import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  fetchApi,
  type LicenseClass,
  type QuizSummary,
  type PracticeLicenseSummary,
} from "@/lib/api-client";
import {
  constructSeoMetadata,
  generateHomePageJsonLd,
  generateFaqJsonLd,
} from "@/lib/seo";
import { LicenseSelectorBoard } from "@/components/home/license-selector-board";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  BarcodeStrip,
  FrequencyRuler,
} from "@/components/telemetry/telemetry-primitives";
import {
  BookOpen,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Car,
  Bike,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const HOME_FAQS = [
  {
    question: "Phần mềm thi thử lý thuyết sát hạch lái xe hoạt động như thế nào?",
    answer:
      "QuizCarLicense mô phỏng chính xác 100% giao diện và thuật toán thi sát hạch lý thuyết của Cục CSGT và Bộ GTVT. Đề thi được rút ngẫu nhiên từ ngân hàng 600 câu hỏi theo ma trận quy định của từng hạng GPLX (B, C, A1...), có đếm ngược thời gian thực, cảnh báo tức thì câu điểm liệt và tự động chấm kết quả ngay khi nộp bài.",
  },
  {
    question: "Làm sai câu hỏi điểm liệt thì kết quả thi sát hạch ra sao?",
    answer:
      "Theo quy định chính thức, mỗi đề thi sát hạch lái xe chứa từ 1 đến 2 câu hỏi điểm liệt (tình huống mất an toàn giao thông nghiêm trọng). Nếu trả lời sai DÙ CHỈ 1 CÂU ĐIỂM LIỆT, thí sinh sẽ bị đánh TRƯỢT TRỰC TIẾP (Không Đạt), bất kể điểm số của các câu còn lại có đạt tối đa.",
  },
  {
    question: "Thời gian làm bài và điểm đạt của các hạng bằng lái xe quy định thế nào?",
    answer:
      "Theo Thông tư 108/2026/TT-BCA: Hạng B (ô tô chở người đến 8 chỗ, tải dưới 3.5 tấn) thi 30 câu trong 20 phút, cần đạt tối thiểu 27/30 điểm; Hạng C1 thi 35 câu trong 22 phút, đạt 32/35 điểm; Hạng C thi 40 câu trong 24 phút, đạt 36/40 điểm; Hạng A1 (mô tô) thi 40 câu trong 27 phút, đạt 36/40 điểm.",
  },
  {
    question: "Bộ 600 câu hỏi sát hạch có áp dụng chung cho cả xe máy và ô tô không?",
    answer:
      "Toàn bộ thí sinh thi giấy phép lái xe ô tô (B, C1, C, D...) ôn tập trọn bộ 600 câu hỏi (bao gồm 60 câu điểm liệt). Thí sinh thi mô tô hạng A1 và A ôn tập 250 câu hỏi được trích xuất từ bộ 600 câu (gồm 53 câu điểm liệt và các quy tắc giao thông xe hai bánh, biển báo, sa hình cơ bản).",
  },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return constructSeoMetadata({
    title: isEn
      ? "Official Vietnam Driving Theory Exam Prep 2026 (600 Questions)"
      : "Thi Thử Sát Hạch Lái Xe Trực Tuyến 2026 - 600 Câu Hỏi & 60 Điểm Liệt (B, C, A1)",
    description: isEn
      ? "Free interactive mock exams for Vietnam driving licenses (A1, A, B, C1, C). 60 critical safety questions, instant grading."
      : "Phần mềm thi thử lý thuyết lái xe ô tô và mô tô chuẩn Cục CSGT. Miễn phí 100%, ngân hàng 600 câu hỏi chính quy, cảnh báo câu điểm liệt tức thì và chấm điểm tự động.",
    path: "/",
    locale,
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ data: licenses }, { data: quizzes }, { data: practiceMatrix }] =
    await Promise.all([
      fetchApi<LicenseClass[]>("/api/v1/license-classes", {
        next: { revalidate: 300 },
      }),
      fetchApi<QuizSummary[]>("/api/v1/quizzes", {
        next: { revalidate: 300 },
      }),
      fetchApi<Record<string, PracticeLicenseSummary>>(
        "/api/v1/quizzes/practice-matrix",
        {
          next: { revalidate: 300 },
        }
      ),
    ]);

  const licenseList = licenses ?? [];
  const quizList = quizzes ?? [];

  // JSON-LD Structured Data
  const homeJsonLd = generateHomePageJsonLd({ locale });
  const faqJsonLd = generateFaqJsonLd(HOME_FAQS);
  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [...(homeJsonLd["@graph"] || []), faqJsonLd],
  };

  return (
    <div className="flex flex-col gap-8 py-6 max-w-6xl mx-auto px-4 w-full select-none">
      {/* Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      {/* 1. Real-time Assessment & Telemetry Dashboard */}
      <LicenseSelectorBoard
        licenses={licenseList}
        quizzes={quizList}
        practiceMatrix={practiceMatrix ?? {}}
      />

      {/* 2. Semantic Topical Section & Internal Link Hub (Prevents Thin Content) */}
      <section className="flex flex-col gap-6 pt-6 border-t border-border">
        {/* Module Header */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-0.5">
          <h2 className="font-bold text-foreground uppercase tracking-wider flex items-center gap-2 text-xs font-mono m-0">
            <Layers className="size-3.5 text-primary" />
            <span>{"//"} QUY CHUẨN KỲ THI SÁT HẠCH LÝ THUYẾT </span>
          </h2>
          <FrequencyRuler count={18} className="hidden sm:flex" />
        </div>

        {/* 11 License Classes Specification Grid (Provides Direct Internal Crawl Links) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {licenseList.slice(0, 6).map((lic) => {
            const firstExam = quizList.find(
              (q) => q.licenseClassCode === lic.code && q.quizType === "OfficialExam"
            );
            const isMoto = lic.vehicleGroup === "Motorbike";

            return (
              <div
                key={lic.code}
                className="border border-border bg-card p-4 flex flex-col justify-between gap-3 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="size-7 border border-primary/40 bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {lic.code}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-foreground font-sans">
                        {lic.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {isMoto ? "MÔ TÔ HAI BÁNH" : "Ô TÔ & XE CHUYÊN DÙNG"}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] font-mono rounded-none border-border">
                    {lic.examSetCount > 0 ? `${lic.examSetCount} ĐỀ THI` : "ĐỀ CHUẨN"}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                  {lic.description}
                </p>

                <div className="grid grid-cols-3 gap-1.5 py-1.5 border-y border-border/60 text-[10px] font-mono text-center">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">SỐ CÂU</span>
                    <strong className="text-foreground">{lic.totalQuestions} câu</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">THỜI GIAN</span>
                    <strong className="text-foreground">{lic.durationMinutes} phút</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">ĐIỂM ĐẠT</span>
                    <strong className="text-primary">{lic.passScore}/{lic.totalQuestions}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <Link
                    href={`/cau-hoi`}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ngân hàng câu hỏi &rarr;
                  </Link>

                  {firstExam ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      render={<Link href={`/thi-sat-hach/${firstExam.quizId}`} />}
                      nativeButton={false}
                      className="h-7 px-2 text-xs font-mono font-bold uppercase rounded-none hover:bg-primary hover:text-primary-foreground cursor-pointer"
                    >
                      <span>Vào thi ngay</span>
                      <ArrowRight className="size-3 ml-1" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Educational Content Panel: Structure & Critical Hazard Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-none border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border/80">
              <CardTitle className="text-sm font-bold font-mono uppercase text-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                <span>Cấu Trúc 600 Câu Hỏi Sát Hạch Bộ GTVT</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2.5 text-xs text-muted-foreground font-sans leading-relaxed">
              <p>
                Toàn bộ tài liệu sát hạch cấp giấy phép lái xe cơ giới đường bộ được chia thành <strong>6 chương chuyên đề</strong> độc lập:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                <li><strong className="text-foreground">Chương 1:</strong> Khái niệm và quy tắc giao thông đường bộ (166 câu)</li>
                <li><strong className="text-foreground">Chương 2:</strong> Nghiệp vụ vận tải hàng hóa & hành khách (26 câu)</li>
                <li><strong className="text-foreground">Chương 3:</strong> Văn hóa giao thông & đạo đức người lái xe (21 câu)</li>
                <li><strong className="text-foreground">Chương 4:</strong> Kỹ thuật lái xe ô tô an toàn (56 câu)</li>
                <li><strong className="text-foreground">Chương 5:</strong> Cấu tạo và sửa chữa xe ô tô thông thường (35 câu)</li>
                <li><strong className="text-foreground">Chương 6:</strong> Hệ thống biển báo hiệu & sa hình giao thông (296 câu)</li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/cau-hoi"
                  className="inline-flex items-center gap-1.5 text-primary font-mono font-bold hover:underline"
                >
                  <span>Tra cứu ngân hàng 600 câu hỏi đầy đủ</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-destructive/40 bg-card">
            <CardHeader className="p-4 pb-2 border-b border-destructive/20">
              <CardTitle className="text-sm font-bold font-mono uppercase text-destructive flex items-center gap-2">
                <ShieldAlert className="size-4" />
                <span>Quy Tắc 60 Câu Hỏi Điểm Liệt Cần Ghi Nhớ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2.5 text-xs text-muted-foreground font-sans leading-relaxed">
              <p>
                Trong bài thi sát hạch lý thuyết thực tế, <strong>sai một câu điểm liệt đồng nghĩa với việc bị trượt ngay lập tức</strong>, kể cả khi bạn trả lời đúng toàn bộ các câu còn lại.
              </p>
              <Alert variant="destructive" className="rounded-none border-destructive/30 bg-destructive/5 py-2">
                <AlertDescription className="text-xs text-muted-foreground">
                  Các câu điểm liệt tập trung vào hành vi nghiêm cấm (sử dụng rượu bia, ma túy, đua xe, chở quá tải trên cao tốc, vượt đường ray khi có tín hiệu đèn đỏ...).
                </AlertDescription>
              </Alert>
              <div className="pt-2">
                <Link
                  href="/cau-hoi?critical=true"
                  className="inline-flex items-center gap-1.5 text-destructive font-mono font-bold hover:underline"
                >
                  <span>Ôn luyện trọn bộ 60 câu điểm liệt có đáp án</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-4 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-foreground font-mono uppercase m-0">
              Câu Hỏi Thường Gặp Về Kỳ Thi Sát Hạch Lái Xe Trực Tuyến
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HOME_FAQS.map((faq, idx) => (
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