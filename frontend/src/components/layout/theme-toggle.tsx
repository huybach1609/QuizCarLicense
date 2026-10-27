"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          />
        }
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
            <Sun className="size-4" />
            <span>Sáng</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
            <Moon className="size-4" />
            <span>Tối</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
            <Laptop className="size-4" />
            <span>Hệ thống</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
