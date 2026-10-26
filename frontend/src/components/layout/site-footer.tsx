import { Link } from "@/i18n/routing";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8 bg-card/40 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">QuizCarLicense</span> — Hệ thống ôn luyện lý thuyết sát hạch lái xe
        </div>
        <div className="flex items-center gap-4">
          <Link href="/cau-hoi" className="hover:text-foreground transition-colors">
            600 Câu hỏi
          </Link>
          <span className="text-border">•</span>
          <Link href="/" className="hover:text-foreground transition-colors">
            Bộ đề thi
          </Link>
        </div>
      </div>
    </footer>
  );
}
