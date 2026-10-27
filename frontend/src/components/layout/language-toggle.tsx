"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const setLanguage = (nextLocale: "vi" | "en") => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            aria-label="Switch language"
          />
        }
      >
        <Languages className="size-3.5" />
        <span>{locale.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setLanguage("vi")} className="justify-between">
            <span>Tiếng Việt</span>
            {locale === "vi" && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage("en")} className="justify-between">
            <span>English</span>
            {locale === "en" && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
