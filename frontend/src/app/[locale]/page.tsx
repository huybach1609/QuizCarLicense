import { setRequestLocale } from "next-intl/server";
import {
  fetchApi,
  type LicenseClass,
  type QuizSummary,
  type PracticeLicenseSummary,
} from "@/lib/api-client";
import { LicenseSelectorBoard } from "@/components/home/license-selector-board";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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

  return (
    <div className="flex flex-col gap-6 py-6 max-w-6xl mx-auto px-4 w-full">
      {/* Real-time Assessment & Telemetry Dashboard */}
      <LicenseSelectorBoard
        licenses={licenses ?? []}
        quizzes={quizzes ?? []}
        practiceMatrix={practiceMatrix ?? {}}
      />
    </div>
  );
}
