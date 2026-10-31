"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatedNumber } from "@/components/telemetry/telemetry-primitives";

interface OnlinePresenceDto {
  onlineCount: number;
  timestamp: string;
}

const STORAGE_KEY = "qcl_presence_id:v1";
let cachedClientId: string | null = null;

function getOrCreateClientId(): string {
  if (cachedClientId) {
    return cachedClientId;
  }

  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    cachedClientId = id;
    return id;
  } catch {
    cachedClientId = `fallback_${Date.now()}`;
    return cachedClientId;
  }
}

interface OnlineBadgeProps {
  className?: string;
  variant?: "default" | "inverted";
}

export function OnlineBadge({ className = "", variant = "default" }: OnlineBadgeProps) {
  const t = useTranslations("Common");
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    let inFlight = false;
    let abortController: AbortController | null = null;
    const clientId = getOrCreateClientId();

    const sendHeartbeat = async () => {
      // Tạm dừng khi tab ẩn hoặc đang có request gửi dở dang
      if (
        (typeof document !== "undefined" && document.visibilityState === "hidden") ||
        inFlight
      ) {
        return;
      }

      inFlight = true;
      abortController = new AbortController();

      try {
        const res = await fetch("/api/v1/presence/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientId }),
          signal: abortController.signal,
        });

        if (res.ok) {
          const data = (await res.json()) as OnlinePresenceDto;
          if (isMounted && typeof data.onlineCount === "number") {
            setOnlineCount(data.onlineCount);
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        // Bỏ qua lỗi kết nối tạm thời khi offline
      } finally {
        inFlight = false;
      }
    };

    // Gửi ngay khi component được mount ở client
    sendHeartbeat();

    // Chu kỳ 60 giây gửi 1 lần
    const intervalId = window.setInterval(sendHeartbeat, 60_000);

    // Kích hoạt ngay khi người dùng quay lại tab trình duyệt
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      abortController?.abort();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isInverted = variant === "inverted";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider select-none ${
        isInverted
          ? "text-emerald-950/80 dark:text-emerald-100/80"
          : "text-muted-foreground"
      } ${className}`}
      title={t("onlineUsers")}
    >
      <span className="opacity-70">ONLINE:</span>
      <span
        className={`font-bold tabular-nums ${
          isInverted
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-primary"
        }`}
      >
        {onlineCount !== null ? (
          <AnimatedNumber value={onlineCount} duration={200} />
        ) : (
          <span className="opacity-40 font-normal">--</span>
        )}
      </span>
    </span>
  );
}
