"use client";

import React from "react";

export function KeyboardGuide() {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-border/70 bg-muted/20 text-muted-foreground w-full select-none">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 w-full max-w-xl">
        {/* Keyboard SVG Illustration */}
        <div className="flex flex-col items-center gap-1.5">
          <svg
            viewBox="0 0 280 120"
            className="w-56 sm:w-64 h-auto drop-shadow-xs"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Keyboard Body */}
            <rect
              x="4"
              y="6"
              width="272"
              height="108"
              rx="8"
              className="fill-card stroke-border"
              strokeWidth="2"
            />
            {/* Esc & F1-F12 strip */}
            <rect x="12" y="14" width="14" height="8" rx="1.5" className="fill-muted stroke-border/50" />
            <rect x="32" y="14" width="56" height="8" rx="1.5" className="fill-muted stroke-border/50" />
            <rect x="94" y="14" width="56" height="8" rx="1.5" className="fill-muted stroke-border/50" />
            <rect x="156" y="14" width="56" height="8" rx="1.5" className="fill-muted stroke-border/50" />

            {/* Number Row with 1, 2, 3, 4 highlighted */}
            <g>
              {/* Highlight box around 1, 2, 3, 4 */}
              <rect
                x="23"
                y="26"
                width="65"
                height="15"
                rx="3"
                className="stroke-primary fill-primary/10"
                strokeWidth="1.5"
                strokeDasharray="2 1"
              />
              {/* Key ~ */}
              <rect x="12" y="28" width="10" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              {/* Keys 1, 2, 3, 4 */}
              <rect x="25" y="28" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="31.5" y="36.5" textAnchor="middle" className="fill-primary text-[7px] font-bold font-mono">1</text>
              <rect x="41" y="28" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="47.5" y="36.5" textAnchor="middle" className="fill-primary text-[7px] font-bold font-mono">2</text>
              <rect x="57" y="28" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="63.5" y="36.5" textAnchor="middle" className="fill-primary text-[7px] font-bold font-mono">3</text>
              <rect x="73" y="28" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="79.5" y="36.5" textAnchor="middle" className="fill-primary text-[7px] font-bold font-mono">4</text>

              {/* Other number keys */}
              <rect x="89" y="28" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="105" y="28" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="121" y="28" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="137" y="28" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="153" y="28" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="169" y="28" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="185" y="28" width="22" height="11" rx="1.5" className="fill-muted stroke-border/50" />
            </g>

            {/* QWERTY Row */}
            <g>
              <rect x="12" y="42" width="15" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="30" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="46" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="62" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="78" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="94" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="110" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="126" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="142" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="158" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="174" y="42" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="190" y="42" width="17" height="11" rx="1.5" className="fill-muted stroke-border/50" />
            </g>

            {/* ASDF Row */}
            <g>
              <rect x="12" y="56" width="19" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="34" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="50" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="66" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="82" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="98" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="114" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="130" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="146" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="162" y="56" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="178" y="56" width="29" height="11" rx="1.5" className="fill-muted stroke-border/50" />
            </g>

            {/* ZXCV Row */}
            <g>
              <rect x="12" y="70" width="24" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="39" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="55" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="71" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="87" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="103" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="119" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="135" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="151" y="70" width="13" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="167" y="70" width="40" height="11" rx="1.5" className="fill-muted stroke-border/50" />
            </g>

            {/* Space Bar Row */}
            <g>
              <rect x="12" y="84" width="20" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="35" y="84" width="15" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="53" y="84" width="18" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="74" y="84" width="70" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="147" y="84" width="18" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="168" y="84" width="15" height="11" rx="1.5" className="fill-muted stroke-border/50" />
              <rect x="186" y="84" width="21" height="11" rx="1.5" className="fill-muted stroke-border/50" />
            </g>

            {/* Navigation & Arrow Cluster */}
            <g>
              {/* Highlight box around Arrow Keys */}
              <rect
                x="213"
                y="69"
                width="48"
                height="28"
                rx="3"
                className="stroke-primary fill-primary/10"
                strokeWidth="1.5"
                strokeDasharray="2 1"
              />
              {/* Arrow Up */}
              <rect x="230" y="71" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="236.5" y="79" textAnchor="middle" className="fill-primary text-[7px] font-bold">▲</text>
              {/* Arrow Left */}
              <rect x="215" y="84" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="221.5" y="92" textAnchor="middle" className="fill-primary text-[7px] font-bold">◄</text>
              {/* Arrow Down */}
              <rect x="230" y="84" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="236.5" y="92" textAnchor="middle" className="fill-primary text-[7px] font-bold">▼</text>
              {/* Arrow Right */}
              <rect x="245" y="84" width="13" height="11" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1" />
              <text x="251.5" y="92" textAnchor="middle" className="fill-primary text-[7px] font-bold">►</text>
            </g>
          </svg>
          <span className="text-[11px] font-medium text-foreground/80">Phím 1-4 & Mũi tên</span>
        </div>

        {/* Text "Hoặc" */}
        <div className="flex items-center justify-center">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            Hoặc
          </span>
        </div>

        {/* Mouse SVG Illustration */}
        <div className="flex flex-col items-center gap-1.5">
          <svg
            viewBox="0 0 60 90"
            className="w-14 sm:w-16 h-auto drop-shadow-xs"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Mouse Body */}
            <path
              d="M10 32C10 16 18 6 30 6C42 6 50 16 50 32V58C50 74 42 84 30 84C18 84 10 74 10 58V32Z"
              className="fill-card stroke-border"
              strokeWidth="2"
            />
            {/* Left Button (Highlighted) */}
            <path
              d="M10 32C10 16 18 6 30 6V36H10V32Z"
              className="fill-primary stroke-primary"
              strokeWidth="1.5"
            />
            {/* Right Button */}
            <path
              d="M30 6C42 6 50 16 50 32V36H30V6Z"
              className="fill-muted stroke-border/60"
              strokeWidth="1"
            />
            {/* Scroll Wheel */}
            <rect
              x="28"
              y="18"
              width="4"
              height="10"
              rx="2"
              className="fill-foreground/70"
            />
            {/* Hand Pointer Hint */}
            <circle cx="20" cy="22" r="3" className="fill-primary-foreground/90 animate-ping" />
            <circle cx="20" cy="22" r="2" className="fill-primary-foreground" />
          </svg>
          <span className="text-[11px] font-medium text-foreground/80">Chuột trái</span>
        </div>
      </div>

      {/* Guide Caption Banner */}
      <p className="mt-3 text-xs text-center font-medium text-foreground/90 leading-relaxed">
        Dùng phím số <strong className="text-primary font-bold">1, 2, 3, 4</strong> và phím mũi tên{" "}
        <strong className="text-primary font-bold">(↑ ↓ ← →)</strong> hoặc dùng chuột để chọn đáp án
      </p>
    </div>
  );
}
