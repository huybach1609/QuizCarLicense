"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { BarcodeStrip } from "@/components/telemetry/telemetry-primitives";
import { OnlineBadge } from "@/components/layout/online-badge";

export function SiteFooter() {
  const t = useTranslations("Common");
  const pathname = usePathname();

  // In exam room (/thi-sat-hach/*) and admin (/admin/*), keep a compact minimal bar to minimize distractions
  const isCompact = pathname.startsWith("/thi-sat-hach") || pathname.startsWith("/admin");

  if (isCompact) {
    return (
      <footer className="border-t border-border bg-card/60 py-6 mt-auto font-mono text-xs select-none">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground">
          <div className="flex items-center gap-3">
            <BarcodeStrip height={10} bars={[1, 2, 1, 3, 2, 1, 2]} className="opacity-50" />
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/cau-hoi" className="hover:text-foreground hover:underline transition-colors uppercase">
              {t("questionBank")}
            </Link>
            <span className="opacity-30">/</span>
            <Link href="/" className="hover:text-foreground hover:underline transition-colors uppercase">
              {t("examSets")}
            </Link>
            <span className="opacity-30">/</span>
            <OnlineBadge />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative w-full mt-auto bg-background text-emerald-950 dark:text-emerald-100 font-mono text-xs select-none overflow-hidden">
      {/* Background panoramic image layer with smooth top mask */}
      <div
        className="absolute inset-0 pointer-events-none select-none z-0 bg-[#043C2B]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40px, black 130px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40px, black 130px)",
        }}
      >
        <Image
          src="/bg_footer.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_70%]"
          priority={false}
        />
      </div>

      {/* Top seamless blend overlay from page background */}
      <div
        className="absolute inset-x-0 top-0 h-32 sm:h-44 pointer-events-none z-10 bg-gradient-to-b from-background via-background/60 to-transparent"
        aria-hidden="true"
      />

      {/* Content layer positioned on the dark sky zone */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pt-20 sm:pt-28 pb-40 sm:pb-52 md:pb-64 lg:pb-72">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand recognition & Telemetry barcode */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="size-6 rounded-none border border-emerald-700/80 dark:border-emerald-400/80 bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs tracking-wider">
                QCL
              </div>
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-emerald-950 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                QUIZCARLICENSE
              </span>
            </Link>
            <BarcodeStrip
              height={10}
              bars={[1, 2, 1, 3, 2, 1, 2]}
              className="text-emerald-900/60 dark:text-emerald-300/50 hidden sm:block ml-1"
            />
          </div>

          {/* Navigation links & Live Presence counter */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] tracking-wider">
            <Link
              href="/cau-hoi"
              className="text-emerald-950/80 dark:text-emerald-100/80 hover:text-emerald-950 dark:hover:text-white hover:underline transition-colors uppercase"
            >
              {t("questionBank")}
            </Link>
            <span className="text-emerald-900/30 dark:text-emerald-300/30">/</span>
            <Link
              href="/"
              className="text-emerald-950/80 dark:text-emerald-100/80 hover:text-emerald-950 dark:hover:text-white hover:underline transition-colors uppercase"
            >
              {t("examSets")}
            </Link>
            <span className="text-emerald-900/30 dark:text-emerald-300/30">/</span>
            <OnlineBadge variant="inverted" />
          </div>
        </div>

        {/* Minimal horizon hairline rule */}
        <div className="w-full h-px bg-emerald-950/15 dark:bg-emerald-300/15 mt-5 sm:mt-6" />
      </div>
    </footer>
  );
}
