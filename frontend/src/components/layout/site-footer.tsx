import { Link } from "@/i18n/routing";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";
import { OnlineBadge } from "@/components/layout/online-badge";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60 py-6 mt-auto font-mono text-xs select-none">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground">
        <div className="flex items-center gap-3">
          <BarcodeStrip height={10} bars={[1, 2, 1, 3, 2, 1, 2]} className="opacity-50" />
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <Link href="/cau-hoi" className="hover:text-foreground hover:underline transition-colors">
            NGÂN HÀNG 600 CÂU
          </Link>
          <span className="opacity-30">/</span>
          <Link href="/" className="hover:text-foreground hover:underline transition-colors">
            BỘ ĐỀ SÁT HẠCH
          </Link>
          <span className="opacity-30">/</span>
          <OnlineBadge />
        </div>
      </div>
    </footer>
  );
}
