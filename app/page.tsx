"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowLeft,
  ArrowsLeftRight,
  ArrowSquareOut,
  BookOpenText,
  Browser,
  CaretRight,
  Check,
  ClockCounterClockwise,
  Coin,
  GearSix,
  House,
  LinkSimple,
  List,
  LockSimple,
  MagnifyingGlass,
  PuzzlePiece,
  Question,
  SlidersHorizontal,
  Sparkle,
  Wallet,
  X,
  XLogo,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BridgeProvider } from "./bridge/BridgeProvider";
import { useBridge, type Phase } from "./bridge/useBridge";
import { isUiTx } from "./bridge/ui-tx-tracker";
import { explorerTxUrl } from "./lib/config";

type CardView = "swap" | "wallet" | "token" | "history" | "settings" | "info";

function BwickMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="ANSEM"
      width={3000}
      height={3000}
      quality={100}
      priority
      loading="eager"
      className={`${className} rounded-full filter-none`}
    />
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <List className={className} aria-hidden="true" />;
}

function SwapIcon() {
  return <ArrowsLeftRight className="h-5 w-5" aria-hidden="true" />;
}

function ClockIcon() {
  return <ClockCounterClockwise className="h-6 w-6" aria-hidden="true" />;
}

function SettingsIcon() {
  return <GearSix className="h-6 w-6" aria-hidden="true" />;
}

function ExternalIcon() {
  return <ArrowSquareOut className="h-4 w-4" aria-hidden="true" />;
}

function MoneyIcon() {
  return <Coin className="h-5 w-5" aria-hidden="true" />;
}

function WalletIcon() {
  return <Wallet className="h-4.5 w-4.5" aria-hidden="true" />;
}

function SearchIcon() {
  return <MagnifyingGlass className="h-5 w-5" aria-hidden="true" />;
}

function WalletConnectIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b95f1] text-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M3 9.5c2.3 0 3.5 1.8 4.6 3.3 1-1.5 2.3-3.3 4.5-3.3 2.3 0 3.5 1.8 4.6 3.3 1-1.5 2.3-3.3 4.3-3.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 14.5c2.3 0 3.5 1.8 4.6 3.3 1-1.5 2.3-3.3 4.5-3.3 2.3 0 3.5 1.8 4.6 3.3 1-1.5 2.3-3.3 4.3-3.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function LedgerIcon() {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#070809] text-white">
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 4v-4h2v6h-6v-2h4Z" fill="currentColor" />
      </svg>
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px] text-black">
        <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
          <path d="M2 8.5 8.5 2H10v1.5L3.5 10H2V8.5Z" fill="currentColor" />
          <path d="M2 6h4v4H2V6Z" fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

function MetaMaskIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
      <span className="text-[22px]">🦊</span>
    </span>
  );
}

function CoinbaseIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1659f5]">
      <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white text-[#1659f5] text-[10px] font-bold">■</span>
    </span>
  );
}

function PhantomLogo() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wallets/phantom.svg"
        alt="Phantom"
        className="h-10 w-10 object-cover"
      />
    </span>
  );
}

function SolflareLogo() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wallets/solflare.svg"
        alt="Solflare"
        className="h-10 w-10 object-cover"
      />
    </span>
  );
}

function KeplrLogo() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wallets/keplr.svg"
        alt="Keplr"
        className="h-10 w-10 object-cover"
      />
    </span>
  );
}

function BwickLogoBadge() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] bg-[#3fae4d]">
      <Image
        src="/logo.png"
        alt="ANSEM Wallet"
        width={3000}
        height={3000}
        quality={100}
        loading="eager"
        className="h-10 w-10 rounded-[10px] object-contain filter-none"
      />
    </span>
  );
}

function BrowserExtensionIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3fae4d] text-white">
      <Browser className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function BrowseWalletsIcon() {
  return (
    <span className="grid h-10 w-10 grid-cols-2 gap-0.5 rounded-xl bg-[#22252c] p-1">
      <span className="flex items-center justify-center rounded-[6px] bg-[#2563ff] text-white text-[10px] font-bold">C</span>
      <span className="flex items-center justify-center rounded-[6px] bg-[#1f8b4c] text-white text-[10px] font-bold">T</span>
      <span className="flex items-center justify-center rounded-[6px] bg-[#3ea0ff] text-white text-[10px] font-bold">W</span>
      <span className="flex items-center justify-center rounded-[6px] bg-[#9b7de3] text-white text-[10px] font-bold">P</span>
    </span>
  );
}

function CloseIcon() {
  return <X className="h-5 w-5" aria-hidden="true" />;
}

function HomeIcon() {
  return <House className="h-5 w-5" aria-hidden="true" />;
}

function SupportIcon() {
  return <Question className="h-5 w-5" aria-hidden="true" />;
}

function LinkIcon() {
  return <LinkSimple className="h-5 w-5" aria-hidden="true" />;
}

function BookIcon() {
  return <BookOpenText className="h-5 w-5" aria-hidden="true" />;
}

function PuzzleIcon() {
  return <PuzzlePiece className="h-5 w-5" aria-hidden="true" />;
}

function LeftSidebar({
  isOpen,
  onOpen,
  onClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <aside
      id="left-sidebar"
      onClick={() => {
        if (!isOpen) onOpen();
      }}
      className={`sidebar-morph sidebar-morph-left ${isOpen ? "sidebar-morph-open" : ""} fixed left-2 top-2 z-50 flex cursor-pointer flex-col overflow-hidden bg-[linear-gradient(180deg,#17191c_0%,#111317_100%)] text-white shadow-[12px_0_40px_rgba(0,0,0,0.32)] ring-1 ring-white/6`}
    >
      <button
        type="button"
        aria-label="Open menu"
        aria-controls="left-sidebar"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        className={`sidebar-morph-button flex h-full w-full items-center gap-2 px-3 text-white ${isOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <BwickMark className="h-8 w-8" />
        <span className="text-[#e8e6ef]">
          <MenuIcon className="h-6 w-6" />
        </span>
      </button>

      <div className={`sidebar-morph-panel flex h-full flex-col ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex items-center justify-between gap-4 px-4 pt-4 text-[#d1d6e0]">
          <div className="flex items-center gap-3">
            <BwickMark />
            <span className="text-[21px] leading-[21px] font-semibold tracking-[0.01em] text-white">ANSEM</span>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-full p-2 text-[#d1d6e0] transition hover:bg-white/6"
          >
            <CloseIcon />
          </button>
        </div>

      <div className="mt-4 border-t border-[#fbfbfd1a]" />

      <nav className="flex-1 overflow-y-auto px-3 py-4 text-[#d1d6e0]">
        <a href="/" className="flex items-center gap-3 rounded-2xl px-4 py-2 text-[18px] hover:bg-white/4">
          <span className="text-[#cfd3dd]">
            <HomeIcon />
          </span>
          <span>Home</span>
        </a>
        <div className="mt-5 px-4 text-[14px] leading-[14px] text-[#676b7e]">Products</div>
        <a
          href="#"
          className="mt-2 flex items-center gap-3 rounded-2xl bg-[#3fae4d] px-4 py-2.5 text-[18px] text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
            <SwapIcon />
          </span>
          <span>Swap</span>
        </a>

        <div className="mt-5 px-4 text-[14px] leading-[14px] text-[#676b7e]">Social</div>
        <a href="#" className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-2 text-[18px] hover:bg-white/4">
          <span className="text-[#cfd3dd]">
            <MoneyIcon />
          </span>
          <span>Token</span>
        </a>
        <a href="https://x.com/ansemchainfun/" target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-2 text-[18px] hover:bg-white/4">
          <span className="text-[#cfd3dd]">
            <XLogo className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Twitter</span>
        </a>

        <div className="mt-5 px-4 text-[14px] leading-[14px] text-[#676b7e]">Developers</div>
        <a href="https://docs.ansemchain.fun" target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-2 text-[18px] hover:bg-white/4">
          <span className="text-[#cfd3dd]">
            <BookIcon />
          </span>
          <span>Docs</span>
        </a>
      </nav>
      </div>
    </aside>
  );
}

function SlidersIcon() {
  return <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />;
}

function SparkIcon() {
  return <Sparkle className="h-5 w-5" aria-hidden="true" />;
}

function HelpIcon() {
  return <Question className="h-6 w-6" aria-hidden="true" />;
}

function ToggleOff() {
  return (
    <span className="relative flex h-[30px] w-[52px] items-center rounded-full border border-[#434753] bg-[#292c32] px-[3px]">
      <span className="ml-auto block h-6 w-6 rounded-full bg-[#a7abbe]" />
    </span>
  );
}

function BackIcon() {
  return <ArrowLeft className="h-6 w-6" aria-hidden="true" />;
}

function ChainLinkIcon() {
  return <LinkSimple className="h-5 w-5" aria-hidden="true" />;
}

function SparkleIcon() {
  return <Sparkle className="h-4 w-4" aria-hidden="true" />;
}

function AssetIcon({
  src,
  alt,
  size = 36,
  className = "",
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const isBwickPng = src === "/logo.png";

  return (
    <Image
      src={src}
      alt={alt}
      width={isBwickPng ? 3000 : size}
      height={isBwickPng ? 3000 : size}
      quality={isBwickPng ? 100 : undefined}
      priority={isBwickPng}
      loading="eager"
      style={{ width: size, height: size }}
      className={`rounded-full object-contain filter-none ${className}`.trim()}
    />
  );
}

function SelectorArrowIcon({ className = "" }: { className?: string }) {
  return <CaretRight className={className} aria-hidden="true" />;
}

function FlipArrowIcon() {
  return <ArrowDown className="h-6 w-6" aria-hidden="true" />;
}

function shortAddr(a: string, head = 6, tail = 4): string {
  if (a.length <= head + tail + 1) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}

function PhaseBanner({ phase }: { phase: Phase }) {
  if (phase.kind === "idle") return null;
  const base =
    "rounded-[10px] border px-3 py-2 text-[13px] leading-[18px]";
  if (phase.kind === "error") {
    if (!phase.message?.trim()) return null;
    return (
      <div className={`${base} border-red-500/40 bg-red-500/10 text-red-200`}>
        {phase.message}
      </div>
    );
  }
  if (phase.kind === "done") {
    const solToBwick = phase.direction === "sol_to_bwick";
    const primaryLabel = solToBwick ? "Solana" : "ansemchain";
    const primaryUrl = solToBwick
      ? `https://solscan.io/tx/${phase.primaryTx}`
      : explorerTxUrl(phase.primaryTx);
    const sisterLabel = solToBwick ? "ansemchain" : "Solana";
    const sisterUrl = phase.sisterTx
      ? solToBwick
        ? explorerTxUrl(phase.sisterTx)
        : `https://solscan.io/tx/${phase.sisterTx}`
      : null;
    return (
      <div className="rounded-[12px] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-100">
        <div className="flex items-start gap-2.5">
          <span className="mt-[1px] flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/50">
            <Check className="h-3 w-3 text-emerald-300" aria-hidden="true" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <div className="text-[12.5px] font-medium leading-[15px]">
              {phase.arrived ? "Bridge complete" : "Burn confirmed"}
              <span className="ml-1.5 text-emerald-300/80">
                {phase.amount} ANSEM
              </span>
            </div>
            {!phase.arrived ? (
              <div className="text-[11px] leading-[14px] text-emerald-300/80">
                Funds arriving on {sisterLabel} shortly.
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-[14px]">
              <a
                href={primaryUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-300 underline-offset-2 hover:underline"
              >
                {primaryLabel}: {shortAddr(phase.primaryTx, 6, 6)}
              </a>
              {sisterUrl ? (
                <a
                  href={sisterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-emerald-300 underline-offset-2 hover:underline"
                >
                  {sisterLabel}: {shortAddr(phase.sisterTx!, 6, 6)}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
  const messages: Record<string, string> = {
    submitting: "Signing & broadcasting…",
    "solana-confirming": "Confirming on Solana…",
    "polling-bwick": "Waiting for relayer to mint on ansemchain…",
    "polling-solana": "Waiting for relayer to release SPL on Solana…",
  };
  return (
    <div className={`${base} border-[#3fae4d]/40 bg-[#3fae4d]/10 text-[#d1d6e0]`}>
      {messages[phase.kind] || "…"}
    </div>
  );
}

function PayAssetSelector({
  direction,
  onClick,
  symbol = "ANSEM",
}: {
  direction: "sol_to_bwick" | "bwick_to_sol";
  onClick?: () => void;
  symbol?: string;
}) {
  const chainIcon =
    direction === "sol_to_bwick" ? "/tokens/sol.svg" : "/logo.png";
  const chainLabel = direction === "sol_to_bwick" ? "Solana" : "ansemchain";
  return (
    <button
      onClick={onClick}
      className="group relative flex h-10 items-center text-[#d1d6e0] focus:outline-none"
    >
      <span className="absolute left-0 top-0 z-10 h-10 w-[72px] text-[#fbfbfd1a]">
        <svg viewBox="0 0 72 40" className="h-10 w-[72px] fill-current" aria-hidden="true">
          <path d="m57.86 5.86c-.53.53-1.05 1.06-1.56 1.59-3.29 3.38-6.37 6.55-10.3 6.55s-7.01-3.17-10.3-6.55c-.51-.53-1.03-1.06-1.56-1.59-3.9-3.91-9.02-5.86-14.14-5.86s-10.24 1.95-14.14 5.86c-3.91 3.9-5.86 9.02-5.86 14.14s1.95 10.24 5.86 14.14c3.91 3.91 9.02 5.86 14.14 5.86s10.24-1.95 14.14-5.86c.52-.53 1.04-1.06 1.55-1.58 3.29-3.39 6.37-6.56 10.31-6.56s7.02 3.17 10.31 6.56c.51.53 1.03 1.06 1.55 1.58 3.91 3.91 9.02 5.86 14.14 5.86v-40c-5.12 0-10.24 1.95-14.14 5.86zm14.14 33.14c-5.07 0-9.85-1.98-13.43-5.56-.52-.52-1.02-1.04-1.54-1.57-3.43-3.53-6.67-6.86-11.02-6.86s-7.6 3.33-11.04 6.88c-.5.52-1.01 1.04-1.53 1.56-3.59 3.59-8.36 5.57-13.44 5.57s-9.85-1.98-13.43-5.57c-3.59-3.59-5.56-8.36-5.56-13.43s1.98-9.85 5.56-13.44c3.58-3.6 8.35-5.58 13.43-5.58s9.85 1.98 13.44 5.57c.52.52 1.04 1.05 1.55 1.58 3.43 3.53 6.66 6.86 11.02 6.86s7.59-3.33 11.02-6.86c.51-.52 1.02-1.05 1.55-1.58 3.59-3.59 8.36-5.56 13.43-5.56v38z" />
        </svg>
      </span>
      <span className="relative z-20 flex h-10 w-[72px] items-center justify-start bg-transparent pl-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2c374b]">
          <AssetIcon src={chainIcon} alt={chainLabel} size={32} />
        </span>
      </span>
      <span className="relative z-20 -ml-[1px] flex h-10 min-w-fit items-center gap-1 rounded-r-full border border-l-0 border-[#27292c] bg-[#17191c] py-1 pr-3 pl-[7px] text-[#d1d6e0] before:absolute before:inset-[-3px] before:z-[-1] before:w-[calc(100%+3px)] before:translate-x-[3px] before:rounded-r-full before:border-2 before:border-l-0 before:border-transparent after:absolute after:inset-[-5px] after:z-[-2] after:w-[calc(100%+4px)] after:translate-x-[6px] after:rounded-r-full after:border-4 after:border-l-0 after:border-transparent">
        <span className="text-[14px] leading-[13px] font-normal">{symbol}</span>
        <SelectorArrowIcon className="h-4 w-4 min-w-4 opacity-66" />
      </span>
    </button>
  );
}

function ReceiveAssetSelector({
  onClick,
  direction,
  symbol = "ANSEM",
}: {
  onClick: () => void;
  direction: "sol_to_bwick" | "bwick_to_sol";
  symbol?: string;
}) {
  // Receive side is whichever chain isn't paying; token = the selected asset.
  const chainIcon =
    direction === "sol_to_bwick" ? "/logo.png" : "/tokens/sol.svg";
  const chainLabel =
    direction === "sol_to_bwick" ? "ansemchain" : "Solana";
  return (
    <button onClick={onClick} className="group relative flex h-10 w-fit items-center text-[#d1d6e0] focus:outline-none">
      <span className="absolute left-0 top-0 z-10 h-10 w-[72px] text-[#fbfbfd1a]">
        <svg viewBox="0 0 72 40" className="h-10 w-[72px] fill-current" aria-hidden="true">
          <path d="m57.86 5.86c-.53.53-1.05 1.06-1.56 1.59-3.29 3.38-6.37 6.55-10.3 6.55s-7.01-3.17-10.3-6.55c-.51-.53-1.03-1.06-1.56-1.59-3.9-3.91-9.02-5.86-14.14-5.86s-10.24 1.95-14.14 5.86c-3.91 3.9-5.86 9.02-5.86 14.14s1.95 10.24 5.86 14.14c3.91 3.91 9.02 5.86 14.14 5.86s10.24-1.95 14.14-5.86c.52-.53 1.04-1.06 1.55-1.58 3.29-3.39 6.37-6.56 10.31-6.56s7.02 3.17 10.31 6.56c.51.53 1.03 1.06 1.55 1.58 3.91 3.91 9.02 5.86 14.14 5.86v-40c-5.12 0-10.24 1.95-14.14 5.86zm14.14 33.14c-5.07 0-9.85-1.98-13.43-5.56-.52-.52-1.02-1.04-1.54-1.57-3.43-3.53-6.67-6.86-11.02-6.86s-7.6 3.33-11.04 6.88c-.5.52-1.01 1.04-1.53 1.56-3.59 3.59-8.36 5.57-13.44 5.57s-9.85-1.98-13.43-5.57c-3.59-3.59-5.56-8.36-5.56-13.43s1.98-9.85 5.56-13.44c3.58-3.6 8.35-5.58 13.43-5.58s9.85 1.98 13.44 5.57c.52.52 1.04 1.05 1.55 1.58 3.43 3.53 6.66 6.86 11.02 6.86s7.59-3.33 11.02-6.86c.51-.52 1.02-1.05 1.55-1.58 3.59-3.59 8.36-5.56 13.43-5.56v38z" />
        </svg>
      </span>
      <span className="relative z-20 flex h-10 w-[72px] items-center justify-start bg-transparent pl-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2c374b]">
          <AssetIcon src={chainIcon} alt={chainLabel} size={32} />
        </span>
      </span>
      <span className="relative z-20 -ml-[1px] flex h-10 min-w-fit items-center gap-1 rounded-r-full border border-l-0 border-[#27292c] bg-[#17191c] py-1 pr-3 pl-[7px] text-[#d1d6e0] before:absolute before:inset-[-3px] before:z-[-1] before:w-[calc(100%+3px)] before:translate-x-[3px] before:rounded-r-full before:border-2 before:border-l-0 before:border-transparent after:absolute after:inset-[-5px] after:z-[-2] after:w-[calc(100%+4px)] after:translate-x-[6px] after:rounded-r-full after:border-4 after:border-l-0 after:border-transparent">
        <span className="text-[14px] leading-[13px] font-normal">{symbol}</span>
        <SelectorArrowIcon className="h-4 w-4 min-w-4 opacity-66" />
      </span>
    </button>
  );
}

type TokenPickerMode = "pay" | "receive";
type ChainName = "Solana" | "ansemchain";

function TokenPicker({
  onBack,
  mode,
  onCommit,
  otherChain,
  onSelectDenom,
  selectedDenom,
}: {
  onBack: () => void;
  mode: TokenPickerMode;
  /** Called when the user confirms a chain+token pick. */
  onCommit: (chain: ChainName) => void;
  /** The chain already selected on the other side. Selecting the same
   *  here surfaces an inline error instead of committing. */
  otherChain: ChainName | null;
  /** Set the bridged asset (native denom) from the picked token row. */
  onSelectDenom: (denom: string) => void;
  /** The single bridge asset (shared by both sides). The bridge moves the SAME
   *  asset across chains, so the Receive side can only be this asset; the other
   *  is shown disabled. The asset is chosen on the Pay side. */
  selectedDenom: string;
}) {
  const [selectedChain, setSelectedChain] = useState<ChainName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chains: { name: ChainName; badge: React.ReactNode }[] = [
    { name: "Solana", badge: <AssetIcon src="/tokens/sol.svg" alt="Solana" /> },
    {
      name: "ansemchain",
      badge: <AssetIcon src="/logo.png" alt="ansemchain" />,
    },
  ];

  // The two BRIDGEABLE ASSETS (not chain-specific): CHANSE and ANSEM. Each row
  // sets the bridged asset (native denom); the chain/direction is the separate
  // pick on the left. If no chain is staged, we commit the natural side.
  const denomChain: ChainName =
    selectedChain ?? (otherChain === "Solana" ? "ansemchain" : "Solana");
  const tokens = [
    {
      name: "CHANSE",
      symbol: "uchanse",
      denom: "uchanse",
      chain: denomChain,
      badge: <AssetIcon src="/logo.png" alt="CHANSE" />,
      chainIcon: <AssetIcon src="/tokens/sol.svg" alt="network" size={18} />,
    },
    {
      name: "ANSEM",
      symbol: "uansem",
      denom: "uansem",
      chain: denomChain,
      badge: <AssetIcon src="/logo.png" alt="ANSEM" />,
      chainIcon: <AssetIcon src="/tokens/sol.svg" alt="network" size={18} />,
    },
  ];

  function pickChain(name: ChainName) {
    if (otherChain && otherChain === name) {
      setError(
        `${name} is already selected on the other side - pick a different chain.`,
      );
      setSelectedChain(null);
      return;
    }
    setError(null);
    setSelectedChain(name);
  }

  function confirmToken(chain: ChainName) {
    if (otherChain && otherChain === chain) {
      setError(
        `${chain} is already selected on the other side - pick a different chain.`,
      );
      return;
    }
    onCommit(chain);
  }

  return (
    <div className="h-[658px] bg-[#191b1f]">
      <div className="flex items-center justify-between px-5 pt-4 text-[#d8dbe6]">
        <button onClick={onBack} className="flex h-10 w-[60px] items-center justify-center rounded-full bg-[#2b2e35] ring-1 ring-white/10">
          <BackIcon />
        </button>
        <div className="pr-10 text-[18px] font-medium">
          {mode === "pay" ? "Pay from" : "Receive on"}
        </div>
        <div className="w-[60px]" />
      </div>

      <div className="mt-5 flex gap-3 px-5">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#1b1d22] px-4 text-[#6f7591]">
          <SearchIcon />
          <span className="text-[18px]">Chain</span>
        </div>
        <div className="flex h-10 min-w-0 flex-[1.65] items-center gap-2 rounded-full border-2 border-[#3fae4d] bg-[#1b1d22] px-4 text-[#6f7591] shadow-[0_0_0_3px_rgba(63,174,77,0.08)]">
          <SearchIcon />
          <span className="text-[18px]">Token</span>
        </div>
      </div>

      <div className="mt-4 border-t border-white/8 px-4 pt-3">
        <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-5">
          <div>
            <button className="flex w-full items-center gap-3 rounded-[16px] bg-[#34363c] px-4 py-3 text-left text-[17px] font-medium text-[#e0e2ea]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3fae4d] text-white">
                <ChainLinkIcon />
              </span>
              <span>ANSEM bridge</span>
            </button>

            <div className="mt-4 flex items-center gap-2 text-[14px] text-[#3fae4d]">
              <SparkleIcon />
              <span>Supported chains</span>
            </div>

            <div className="mt-3 space-y-3">
              {chains.map((chain) => {
                const isDisabled = otherChain === chain.name;
                const isSelected = selectedChain === chain.name;
                return (
                  <button
                    key={chain.name}
                    onClick={() => pickChain(chain.name)}
                    disabled={isDisabled}
                    className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-1 text-left text-[17px] transition ${
                      isDisabled
                        ? "cursor-not-allowed text-[#5a5e6c] opacity-40"
                        : isSelected
                          ? "bg-[#3fae4d2a] text-white ring-1 ring-[#3fae4d]"
                          : "text-[#d8dbe6] hover:bg-white/4"
                    }`}
                  >
                    {chain.badge}
                    <span>{chain.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-[14px] text-[#3fae4d]">
              <SparkleIcon />
              <span>Popular tokens</span>
            </div>

            <div className="mt-3 space-y-3">
              {tokens.map((token, index) => {
                // The bridge moves the SAME asset both ways. The asset is chosen
                // on the Pay side; on the Receive side only the selected asset is
                // available, so the mismatched one is disabled (no ANSEM->CHANSE).
                const assetLocked =
                  mode === "receive" && token.denom !== selectedDenom;
                const isDisabled = otherChain === token.chain || assetLocked;
                return (
                  <button
                    key={`${token.symbol}-${index}`}
                    onClick={() => {
                      onSelectDenom(token.denom);
                      confirmToken(token.chain);
                    }}
                    disabled={isDisabled}
                    className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-1 text-left transition ${
                      isDisabled
                        ? "cursor-not-allowed opacity-40"
                        : "text-[#d8dbe6] hover:bg-white/4"
                    }`}
                  >
                    <div className="relative">
                      {token.badge}
                      <span className="absolute -bottom-1 -right-1 block scale-[0.7]">
                        {token.chainIcon}
                      </span>
                    </div>
                    <span className="leading-tight">
                      <span className="block text-[17px] font-medium">
                        {token.name}
                      </span>
                      <span className="block text-[14px] text-[#8d92a8]">
                        {token.symbol}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {error ? (
              <div className="mt-4 rounded-[10px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RelayerTx {
  id: string;
  type?: string;
  direction?: string;
  status: string;
  amount: string;
  solanaTxHash?: string | null;
  bwickTxHash?: string | null;
}

function ubwickToBwick(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return (n / 1_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function HistoryView({
  onBack,
  bridge,
}: {
  onBack: () => void;
  bridge: ReturnType<typeof useBridge>;
}) {
  const [items, setItems] = useState<RelayerTx[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // The relayer history endpoint accepts either a bwick1… or a Solana
  // pubkey; whichever wallet is connected, look it up.
  const probe = bridge.bwickAddress || bridge.solAddress;

  useEffect(() => {
    if (!probe) {
      setItems([]);
      return;
    }
    let cancelled = false;
    // HTTPS domain (TLS-terminated proxy to the relayer on :3000). A plain
    // http:// default is mixed-content-blocked on the https dApp.
    const RELAYER_API =
      process.env.NEXT_PUBLIC_RELAYER_API_URL ||
      "https://relayer.bwick.fun";
    const load = async () => {
      try {
        const res = await fetch(
          `${RELAYER_API}/api/bridge/history/${probe}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { transactions?: RelayerTx[] };
        if (!cancelled) {
          setItems(json.transactions ?? []);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    };
    void load();
    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [probe]);

  return (
    <div className="min-h-[658px] bg-[#17191c]">
      <div className="px-5 pt-3">
        <button
          onClick={onBack}
          className="flex h-10 w-[60px] items-center justify-center rounded-[20px] border border-[#fbfbfd1a] bg-[#292c32] text-[#d1d6e0]"
        >
          <BackIcon />
        </button>
      </div>

      <div className="px-5 pt-6">
        <h1 className="text-[32px] leading-[32px] font-normal text-[#d1d6e0]">History</h1>
      </div>

      <div className="mt-4 border-t border-[#fbfbfd1a]" />

      {!probe ? (
        <div className="flex min-h-[500px] items-center justify-center px-6 text-center">
          <p className="text-[17px] leading-[18px] text-[#676b7e]">
            Connect a wallet to see your bridge history.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[500px] items-center justify-center px-6 text-center">
          <p className="text-[17px] leading-[18px] text-[#676b7e]">
            {err ? `Couldn't reach relayer: ${err}` : "No bridges yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.slice(0, 20).map((tx) => {
            const isIn =
              tx.type === "deposit" || tx.direction === "solana_to_bwick";
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between border-b border-[#fbfbfd0d] px-5 py-3"
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-[15px] text-[#d1d6e0]">
                    {isIn ? "Bridged in" : "Bridged out"}
                    {isUiTx(tx.solanaTxHash, tx.bwickTxHash) ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#3fae4d]/18 px-1.5 py-[2px] text-[10px] font-medium tracking-tight text-[#9be5a0]">
                        <span className="h-1 w-1 rounded-full bg-[#9be5a0]" aria-hidden="true" />
                        ui
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#fbfbfd]/8 px-1.5 py-[2px] text-[10px] font-medium tracking-tight text-[#9ca2b3]">
                        <span className="h-1 w-1 rounded-full bg-[#9ca2b3]" aria-hidden="true" />
                        wallet
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] text-[#676b7e]">
                    {tx.status}
                    {tx.solanaTxHash ? (
                      <>
                        {" · "}
                        <a
                          href={`https://solscan.io/tx/${tx.solanaTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#3fae4d]"
                        >
                          sol {shortAddr(tx.solanaTxHash, 6, 4)}
                        </a>
                      </>
                    ) : null}
                    {tx.bwickTxHash ? (
                      <>
                        {" · "}
                        <a
                          href={explorerTxUrl(tx.bwickTxHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#3fae4d]"
                        >
                          bwick {shortAddr(tx.bwickTxHash, 6, 4)}
                        </a>
                      </>
                    ) : null}
                  </span>
                </div>
                <span className="text-[15px] font-medium text-[#d1d6e0]">
                  {isIn ? "+" : "−"}
                  {ubwickToBwick(tx.amount)} ANSEM
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[658px] bg-[#17191c]">
      <div className="px-5 pt-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-[60px] items-center justify-center rounded-[20px] border border-[#fbfbfd1a] bg-[#292c32] text-[#d1d6e0]"
        >
          <BackIcon />
        </button>
      </div>

      <div className="px-6 pt-6">
        <h1 className="text-[32px] leading-[34px] font-normal text-[#d1d6e0]">
          How it works
        </h1>
      </div>

      <div className="px-6 pt-5 pb-8 text-[15px] leading-[22px] text-[#b9bccb]">
        <p>
          Hold ANSEM on one chain, get the same amount on the other. You sign
          on the chain you&apos;re paying from. Validators see the transfer
          and mint or release the matching amount on the other side. One to
          one. You only pay gas.
        </p>

        <div className="mt-6 flex items-center gap-3 text-[#d1d6e0]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3fae4d]/20 ring-1 ring-[#3fae4d]/40">
            <Image
              src="/logo.png"
              alt=""
              width={3000}
              height={3000}
              quality={100}
              loading="eager"
              className="h-5 w-5 rounded-full filter-none"
            />
          </span>
          <span className="text-[17px] leading-[20px] font-medium">
            ANSEM Wallet
          </span>
        </div>

        <p className="mt-3">
          One browser extension that covers both chains with a single
          approval. Phantom or Keplr also work, but each only signs for one
          side, so you connect twice.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-[13px]">
          <a
            href="https://chromewebstore.google.com/detail/bwick-wallet/cdamjfbpapiegcgalkhkfbppcgbjjnpl?hl=es"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#3fae4d]/50 bg-[#3fae4d]/12 px-3 py-1.5 text-[#9be5a0] transition hover:border-[#3fae4d]"
          >
            Install ANSEM Wallet
          </a>
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#fbfbfd1f] bg-[#292c32] px-3 py-1.5 text-[#d1d6e0] transition hover:border-[#fbfbfd33]"
          >
            Phantom
          </a>
          <a
            href="https://www.keplr.app/get"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#fbfbfd1f] bg-[#292c32] px-3 py-1.5 text-[#d1d6e0] transition hover:border-[#fbfbfd33]"
          >
            Keplr
          </a>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative min-h-[658px] overflow-hidden rounded-[30px] bg-[#17191c]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-20 h-24 w-24 rounded-full bg-[#ffffff10] blur-3xl" />
        <div className="absolute left-8 top-44 h-14 w-40 rounded-full bg-[#3fae4d] blur-2xl" />
        <div className="absolute right-20 top-6 h-20 w-20 rounded-full bg-[#ffffff10] blur-3xl" />
        <div className="absolute bottom-44 right-8 h-20 w-24 rounded-full bg-[#ffffff08] blur-3xl" />
        <div className="absolute bottom-56 left-24 h-20 w-20 rounded-full bg-[#ffffff08] blur-3xl" />
      </div>

      <div className="relative flex min-h-[658px] flex-col justify-end p-5">
        <div className="rounded-[28px] border border-[#434753] bg-[#2b2e35]/96 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[#d1d6e0]">
              <span className="text-[#3fae4d]">
                <SlidersIcon />
              </span>
              <span className="text-[18px] leading-[18px]">Slippage</span>
              <HelpIcon />
            </div>
            <div className="flex items-center rounded-[14px] border border-[#434753] bg-[#25282e] p-1 text-[16px] leading-[16px]">
              <button className="rounded-[11px] border border-[#3fae4d] px-4 py-2 text-[#d1d6e0] shadow-[0_0_0_1px_rgba(63,174,77,0.15)]">
                Auto
              </button>
              <button className="px-4 py-2 text-[#d1d6e0] opacity-90">Custom</button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[#d1d6e0]">
              <span className="text-[#3fae4d]">
                <SparkIcon />
              </span>
              <span className="text-[18px] leading-[18px]">Degen mode</span>
              <HelpIcon />
            </div>
            <ToggleOff />
          </div>

          <div className="mt-4 border-t border-[#434753] pt-2 text-center text-[14px] leading-[14px] text-[#676b7e]">v6.10.0</div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 flex h-[60px] w-full items-center justify-center rounded-2xl bg-[#3fae4d] text-[22px] leading-[22px] font-normal text-[#17191c] transition-colors hover:bg-[#58c964]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function SignInSidebar({
  isOpen,
  onOpen,
  onClose,
  bridge,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  bridge: ReturnType<typeof useBridge>;
}) {
  // Detect whether the BWICK Wallet extension is present. It exposes
  // both the Solana standard wallet AND window.bwickWallet.cosmos, so a
  // user with the extension can sign once and get both sides connected
  // in a single flow. Phantom + Keplr (separate installs) need two
  // signatures, one per chain.
  const [hasBwickExt, setHasBwickExt] = useState(false);
  useEffect(() => {
    function detect() {
      const w = window as unknown as {
        ansemWallet?: { cosmos?: unknown };
        bwickWallet?: { cosmos?: unknown };
      };
      const cosmosSide =
        typeof window !== "undefined" &&
        Boolean(w.ansemWallet?.cosmos ?? w.bwickWallet?.cosmos);
      // We can't reliably introspect the Solana Standard Wallet list from
      // outside the adapter, but if the BWICK extension's cosmos surface
      // is up the Solana side is too - they ship together.
      setHasBwickExt(cosmosSide);
    }
    detect();
    const t = window.setTimeout(detect, 500);
    return () => window.clearTimeout(t);
  }, []);

  const solConnected = bridge.solConnected && bridge.solAddress;
  const bwickConnected = Boolean(bridge.bwickAddress);
  const bothConnected = Boolean(solConnected && bwickConnected);

  const [busy, setBusy] = useState<
    null | "both" | "phantom" | "bwick" | "keplr"
  >(null);

  async function connectBoth() {
    setBusy("both");
    try {
      // Two independent sides. The extension registers its Solana Standard
      // Wallet as "ANSEM Wallet" (modules/solana/bwick-solana.ts) — NOT the
      // pre-rebrand "BWICK Wallet", whose lookup missed and threw
      // WalletNotSelectedError. Each side is also wrapped on its own: the
      // cosmos connect uses window.bwickWallet.cosmos directly and does not
      // depend on the Solana adapter, so a Solana failure must not abort it.
      if (!solConnected) {
        try {
          await bridge.connectSolana("ANSEM Wallet");
        } catch {
          /* surface via phase; still attempt the ansemchain side below */
        }
      }
      if (!bwickConnected) {
        await bridge.connectBwick("bwick");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <aside
      onClick={() => {
        if (!isOpen) onOpen();
      }}
      className={`sidebar-morph sidebar-morph-right ${solConnected || bwickConnected ? "sidebar-morph-right-connected" : ""} ${isOpen ? "sidebar-morph-open" : ""} fixed right-2 top-2 z-50 flex cursor-pointer flex-col overflow-hidden bg-[#17191c] text-white shadow-[-12px_0_40px_rgba(0,0,0,0.28)]`}
    >
      <div className={`sidebar-morph-button flex h-full w-full items-center justify-center ${isOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <SignInButton bridge={bridge} isOpen={false} onClick={onOpen} className="h-full w-full justify-center rounded-[18px]" />
      </div>

      <div className={`sidebar-morph-panel flex h-full flex-col ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex items-center justify-end gap-5 px-4 pt-3 text-[#d1d6e0]">
          <button onClick={onClose} className="rounded-full p-1 text-white transition hover:bg-white/6">
            <CloseIcon />
          </button>
        </div>

        <div className="px-5 pt-7">
          <h2 className="text-[36px] leading-[36px] font-normal text-[#d1d6e0]">
            {bothConnected ? "Connected" : "Sign In"}
          </h2>
          {bothConnected ? (
            <p className="mt-2 text-[14px] text-[#676b7e]">
              Both chains are ready. Close to go back to the bridge.
            </p>
          ) : (
            <p className="mt-2 text-[14px] text-[#676b7e]">
              ANSEM bridges between Solana and ansemchain. You need a
              wallet on each side. The ANSEM Wallet extension does both in
              one signature.
            </p>
          )}
        </div>

      <div className="mt-4 border-t border-[#fbfbfd1a]" />

      <div className="px-5 py-5 space-y-5">
        {/* Connection status - always visible. */}
        <div className="space-y-2 text-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-[#676b7e]">Solana</span>
            <span
              className={
                solConnected
                  ? "font-mono text-[#3fae4d]"
                  : "text-[#676b7e] italic"
              }
            >
              {solConnected ? shortAddr(bridge.solAddress!) : "not connected"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#676b7e]">ansemchain</span>
            <span
              className={
                bwickConnected
                  ? "font-mono text-[#3fae4d]"
                  : "text-[#676b7e] italic"
              }
            >
              {bwickConnected ? shortAddr(bridge.bwickAddress!) : "not connected"}
            </span>
          </div>
        </div>

        {!bothConnected ? (
          <>
            {/* One-click both-chain connect when BWICK extension is detected. */}
            {hasBwickExt ? (
              <button
                onClick={connectBoth}
                disabled={busy !== null}
                className="flex w-full items-center justify-between rounded-2xl bg-[#3fae4d] px-4 py-3 text-left text-[#17191c] transition hover:brightness-95 disabled:opacity-60"
              >
                <span className="flex items-center gap-3">
                  <BwickLogoBadge />

                  <span className="flex flex-col">
                    <span className="text-[16px] font-medium">
                      ANSEM Wallet · connect both chains
                    </span>
                    <span className="text-[12px] opacity-75">
                      one signature, Solana + ansemchain
                    </span>
                  </span>
                </span>
                <span className="text-[20px]">{busy === "both" ? "…" : "›"}</span>
              </button>
            ) : null}

            {/* Per-chain fallbacks. */}
            <div className="space-y-2">
              <div className="text-[12px] uppercase tracking-[0.06em] text-[#676b7e]">
                or connect each side separately
              </div>
              <button
                onClick={async () => {
                  setBusy("phantom");
                  try {
                    await bridge.connectSolana("Phantom");
                  } finally {
                    setBusy(null);
                  }
                }}
                disabled={busy !== null || !!solConnected}
                className="flex w-full items-center justify-between text-left text-[#d1d6e0] disabled:opacity-60"
              >
                <span className="flex items-center gap-4">
                  <PhantomLogo />
                  <span className="flex flex-col">
                    <span className="text-[17px] leading-[18px]">Phantom</span>
                    <span className="text-[12px] text-[#676b7e]">Solana</span>
                  </span>
                </span>
                <span className="text-[#3fae4d]">
                  {solConnected ? "✓" : busy === "phantom" ? "…" : "›"}
                </span>
              </button>
              <button
                onClick={async () => {
                  setBusy("bwick");
                  try {
                    await bridge.connectBwick("bwick");
                  } finally {
                    setBusy(null);
                  }
                }}
                disabled={busy !== null || bwickConnected}
                className="flex w-full items-center justify-between text-left text-[#d1d6e0] disabled:opacity-60"
              >
                <span className="flex items-center gap-4">
                  <BwickLogoBadge />
                  <span className="flex flex-col">
                    <span className="text-[17px] leading-[18px]">
                      ANSEM Wallet
                    </span>
                    <span className="text-[12px] text-[#676b7e]">
                      ansemchain side
                    </span>
                  </span>
                </span>
                <span className="text-[#3fae4d]">
                  {bwickConnected ? "✓" : busy === "bwick" ? "…" : "›"}
                </span>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => {
              bridge.disconnectAll();
            }}
            className="w-full rounded-full border border-[#fbfbfd1a] py-3 text-[15px] text-[#676b7e] transition hover:text-[#d1d6e0]"
          >
            Disconnect all
          </button>
        )}
      </div>
      </div>
    </aside>
  );
}

function WalletModal({
  onClose,
  bridge,
}: {
  onClose: () => void;
  bridge: ReturnType<typeof useBridge>;
}) {
  const solStandard = bridge.solConnected && bridge.solAddress;
  const bwickConnected = Boolean(bridge.bwickAddress);
  // The ANSEM Wallet supplies BOTH chains; Phantom/Solflare each supply
  // exactly one. Track *which* adapter is actually attached so the per-row
  // ✓ marks reflect the truth instead of just "any wallet on this chain".
  // The extension registers its Solana wallet as "ANSEM Wallet" (post-rebrand),
  // so matching the old "BWICK Wallet" here left it never marked connected.
  const solByBwick = bridge.solWalletName === "ANSEM Wallet";
  const solByPhantom = bridge.solWalletName === "Phantom";
  const solBySolflare = bridge.solWalletName === "Solflare";
  const bwickByBwick = bridge.bwickWalletKind === "bwick";
  const bothConnected = Boolean(solByBwick && bwickByBwick);
  const [busyStep, setBusyStep] = useState<
    null | "solana" | "bwick"
  >(null);
  const [stepError, setStepError] = useState<string | null>(null);

  async function connectBoth() {
    setStepError(null);
    try {
      // Sequential, not parallel: each wallet pops its own approval
      // window and the user can only deal with one at a time. Solana
      // first so the Pay row updates before we trigger the second
      // popup.
      if (!solStandard) {
        setBusyStep("solana");
        try {
          await bridge.connectSolana("ANSEM Wallet");
        } catch (e) {
          // The ansemchain side is independent (window.bwickWallet.cosmos), so
          // don't let a Solana-side failure abort it; record and continue.
          setStepError(e instanceof Error ? e.message : "Solana connect failed");
        }
      }
      if (!bwickConnected) {
        setBusyStep("bwick");
        await bridge.connectBwick("bwick");
      }
      setBusyStep(null);
      onClose();
    } catch (err) {
      setBusyStep(null);
      setStepError(
        err instanceof Error ? err.message : "Connection failed",
      );
    }
  }

  // Single-chain wallets - each handles one side only.
  const singleChainRows: Array<{
    label: string;
    sub: string;
    icon: React.ReactNode;
    connected: boolean;
    onClick: () => void;
  }> = [
    {
      label: "Phantom",
      sub: solByPhantom
        ? `connected · ${shortAddr(bridge.solAddress!)}`
        : "Solana wallet",
      icon: <PhantomLogo />,
      connected: solByPhantom,
      onClick: () =>
        solByPhantom ? undefined : void bridge.connectSolana("Phantom"),
    },
    {
      label: "Solflare",
      sub: solBySolflare
        ? `connected · ${shortAddr(bridge.solAddress!)}`
        : "Solana wallet",
      icon: <SolflareLogo />,
      connected: solBySolflare,
      onClick: () =>
        solBySolflare ? undefined : void bridge.connectSolana("Solflare"),
    },
  ];

  return (
    <div className="bg-[linear-gradient(180deg,rgba(24,26,30,0.98)_0%,rgba(16,18,22,0.98)_100%)] p-10 pb-5">
      <div className="rounded-[26px] border border-white/10 bg-[#2b2e35] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-3 rounded-full border-2 border-[#3fae4d] px-4 py-3 text-[#6f7591] shadow-[0_0_0_3px_rgba(63,174,77,0.08)]">
          <SearchIcon />
          <span className="text-[18px]">Select your wallet</span>
        </div>

        <div className="mt-4 space-y-3 pb-2">
          {/* Featured: BWICK Wallet - one signature covers both chains.
              Visually separated so it's clear this is its own category. */}
          <button
            onClick={() => {
              if (bothConnected) return;
              void (async () => {
                if (!solStandard) {
                  // "ANSEM Wallet" is the extension's registered Solana wallet
                  // name; the old "BWICK Wallet" missed and threw
                  // WalletNotSelectedError. Each side is independent, so a
                  // Solana failure must not skip the ansemchain connect.
                  try {
                    await bridge.connectSolana("ANSEM Wallet");
                  } catch {
                    /* continue to the ansemchain side */
                  }
                }
                if (!bwickConnected) {
                  await bridge.connectBwick("bwick");
                }
              })();
              if (!bothConnected) onClose();
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-[#3fae4d]/50 bg-[#3fae4d]/12 px-3 py-2.5 text-left text-[#d8d9e1] transition hover:border-[#3fae4d] hover:bg-[#3fae4d]/20"
          >
            <span className="flex items-center gap-4 text-[20px] font-medium">
              <BwickLogoBadge />
              <span className="flex flex-col">
                <span>ANSEM Wallet</span>
                <span className="text-[12px] font-normal text-[#9be5a0]">
                  one signature · Solana + ansemchain
                </span>
              </span>
            </span>
            <span className="text-[28px] leading-none text-[#9be5a0]">
              {bothConnected ? "✓" : "›"}
            </span>
          </button>

          {/* Per-chain alternatives - for users without the BWICK extension. */}
          <div className="pt-1">
            <div className="px-2 pb-1 text-[11px] uppercase tracking-[0.06em] text-[#676b7e]">
              Or connect each side separately
            </div>
            <div className="space-y-2">
              {singleChainRows.map((row) => (
                <button
                  key={row.label}
                  onClick={() => {
                    row.onClick();
                    if (!row.connected) onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-2 py-2 text-left text-[#d8d9e1] transition hover:bg-white/4"
                >
                  <span className="flex items-center gap-4 text-[20px] font-medium">
                    {row.icon}
                    <span className="flex flex-col">
                      <span>{row.label}</span>
                      <span className="text-[12px] font-normal text-[#7d8192]">
                        {row.sub}
                      </span>
                    </span>
                  </span>
                  <span className="text-[28px] leading-none text-[#7d8192]">
                    {row.connected ? "✓" : "›"}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-5 flex h-[60px] w-full items-center justify-center rounded-2xl bg-[#3fae4d] text-[22px] font-medium text-[#17191c] transition-colors hover:bg-[#58c964]"
      >
        Done
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <BridgeProvider>
      <BridgeInner />
    </BridgeProvider>
  );
}

function SignInButton({
  bridge,
  isOpen,
  onClick,
  className = "",
}: {
  bridge: ReturnType<typeof useBridge>;
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}) {
  const solConnected = bridge.solConnected && bridge.solAddress;
  const bwickConnected = Boolean(bridge.bwickAddress);
  // The ANSEM Wallet supplies both chains in one signature, so if both sides
  // were attached through it, treat the pair as a single wallet (one logo).
  const bwickProvidedBoth =
    bridge.solWalletName === "ANSEM Wallet" &&
    bridge.bwickWalletKind === "bwick" &&
    solConnected &&
    bwickConnected;
  const showPhantomBadge =
    solConnected && !bwickProvidedBoth && bridge.solWalletName === "Phantom";
  const showSolflareBadge =
    solConnected && !bwickProvidedBoth && bridge.solWalletName === "Solflare";
  const showBwickBadge =
    bwickProvidedBoth ||
    (bwickConnected && bridge.bwickWalletKind === "bwick");
  const showKeplrBadge =
    bwickConnected && !bwickProvidedBoth && bridge.bwickWalletKind === "keplr";
  const badgeCount =
    (showPhantomBadge ? 1 : 0) +
    (showSolflareBadge ? 1 : 0) +
    (showBwickBadge ? 1 : 0) +
    (showKeplrBadge ? 1 : 0);
  const anyConnected = solConnected || bwickConnected;

  const triggerStateClass = isOpen
    ? "pointer-events-none opacity-0"
    : "translate-x-0 opacity-100";
  const shapeClass = className || "rounded-full";

  if (!anyConnected) {
    return (
      <button
        onClick={onClick}
        className={`relative z-10 bg-[#0e1013] px-5 py-3 text-[15px] font-medium text-white transition-[background-color,opacity] duration-300 ease-out hover:bg-[#15171b] ${shapeClass} ${triggerStateClass}`}
      >
        Sign In
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      title={
        [
          solConnected ? `Solana ${bridge.solAddress}` : null,
          bwickConnected ? `bwickchain ${bridge.bwickAddress}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      }
      className={`relative z-10 inline-flex items-center gap-1.5 bg-[#0e1013] px-3 py-1.5 text-[13px] font-medium text-white transition-[background-color,opacity] duration-300 ease-out hover:bg-[#15171b] ${shapeClass} ${triggerStateClass}`}
    >
      <LockSimple weight="fill" className="h-3.5 w-3.5 text-[#34d399]" aria-hidden="true" />
      <span>Connected</span>
    </button>
  );
}

function BridgeInner() {
  const bridge = useBridge();
  const [cardView, setCardView] = useState<CardView>("swap");
  // Which side of the bridge the picker is editing: "pay" (sending) or
  // "receive". When the user commits a "pay" pick we auto-advance to
  // the "receive" picker so the flow is a single guided sequence.
  const [pickerMode, setPickerMode] = useState<"pay" | "receive">("pay");
  const [isSignInSidebarOpen, setIsSignInSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  // What chain is on each side, derived from bridge.direction.
  const payChain: ChainName =
    bridge.direction === "sol_to_bwick" ? "Solana" : "ansemchain";
  const receiveChain: ChainName =
    bridge.direction === "sol_to_bwick" ? "ansemchain" : "Solana";

  function handlePickerCommit(chain: ChainName) {
    if (pickerMode === "pay") {
      // Setting the Pay chain implicitly sets the direction. If the
      // pick keeps Pay the same we no-op; otherwise we flip.
      if (chain !== payChain) bridge.flip();
      setPickerMode("receive");
      // Stay on the picker view so the user immediately sees the
      // receive step with the other chain greyed in/selected.
    } else {
      if (chain !== receiveChain) bridge.flip();
      setCardView("swap");
      setPickerMode("pay");
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsLeftSidebarOpen(false);
      setIsSignInSidebarOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const contentShiftClass =
    isLeftSidebarOpen && isSignInSidebarOpen
      ? "translate-x-0"
      : isLeftSidebarOpen
        ? "md:translate-x-6 lg:translate-x-10"
        : isSignInSidebarOpen
          ? "md:-translate-x-6 lg:-translate-x-10"
          : "translate-x-0";

  return (
    <main className="relative h-screen overflow-hidden text-white">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/IMG_6247.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <LeftSidebar
        isOpen={isLeftSidebarOpen}
        onOpen={() => setIsLeftSidebarOpen(true)}
        onClose={() => setIsLeftSidebarOpen(false)}
      />

      <SignInSidebar
        isOpen={isSignInSidebarOpen}
        onOpen={() => setIsSignInSidebarOpen(true)}
        onClose={() => setIsSignInSidebarOpen(false)}
        bridge={bridge}
      />

      <section
        className={`flex h-screen items-center justify-center overflow-hidden px-4 pb-10 pt-24 transition-transform duration-300 ease-out sm:px-6 md:pt-14 ${contentShiftClass}`}
      >
        <div key={cardView} data-morph={cardView === "swap" ? "grow" : "shrink"} className="card-morph w-full max-w-[480px] overflow-hidden rounded-[30px] border border-[#fbfbfd1a] bg-[#17191c] text-[#d1d6e0] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.2),0px_5px_50px_-1px_rgba(0,0,0,0.33)] outline outline-1 outline-[#fbfbfd1a]">
          {cardView === "wallet" ? (
            <WalletModal onClose={() => setCardView("swap")} bridge={bridge} />
          ) : cardView === "settings" ? (
            <SettingsView onClose={() => setCardView("swap")} />
          ) : cardView === "history" ? (
            <HistoryView onBack={() => setCardView("swap")} bridge={bridge} />
          ) : cardView === "info" ? (
            <InfoView onBack={() => setCardView("swap")} />
          ) : cardView === "token" ? (
            <TokenPicker
              onBack={() => {
                setCardView("swap");
                setPickerMode("pay");
              }}
              mode={pickerMode}
              otherChain={pickerMode === "pay" ? receiveChain : payChain}
              onCommit={handlePickerCommit}
              onSelectDenom={bridge.setSelectedDenom}
              selectedDenom={bridge.selectedDenom}
            />
          ) : (
            <>
              <nav className="flex max-h-[120px] flex-row-reverse bg-[#17191c] px-[15px] pt-6 text-[#d1d6e0]">
                <span className="flex flex-1 items-center justify-end gap-2">
                  <button
                    onClick={() => setCardView("info")}
                    aria-label="How it works"
                    className="flex h-10 min-w-[40px] items-center justify-center rounded-[20px] border border-[#fbfbfd1a] bg-[#292c32] text-[#d1d6e0] transition hover:border-[#fbfbfd54]"
                  >
                    <span className="text-[16px] leading-none font-medium">?</span>
                  </button>
                  <button
                    onClick={() => setCardView("history")}
                    className="flex h-10 min-w-[60px] items-center justify-center rounded-[20px] border border-[#fbfbfd1a] bg-[#292c32] text-[#d1d6e0] transition hover:border-[#fbfbfd54]"
                  >
                    <ClockIcon />
                  </button>
                </span>
              </nav>

              <div className="px-6">
                <nav className="relative flex items-center">
                  <button className="relative flex h-12 items-center text-[#d1d6e0]">
                    <span className="text-[27px] leading-[28px] font-normal">Swap</span>
                  </button>
                  <div className="absolute bottom-0 h-0.5 w-[69px] rounded-[1px] bg-[#3fae4d]" />
                </nav>
              </div>

              <section className="relative flex w-full flex-col border-t border-[#fbfbfd1a] bg-[#17191c] pb-4">
                <header className="flex h-12 items-center px-4 py-1">
                  <button
                    onClick={() => setCardView("wallet")}
                    className="flex h-8 items-center gap-2 rounded-[10px] px-2 text-[#676b7e] transition hover:bg-[#fbfbfd1a]"
                  >
                    <span className="text-[17px] leading-[18px]">Pay</span>
                    <span className="text-[17px] leading-[18px] text-[#676b7e]">:</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#fbfbfd1a] bg-[#3fae4d] text-[#17191c]">
                      <WalletIcon />
                    </span>
                    <span className="text-[17px] leading-[18px] text-[#3fae4d]">
                      {bridge.direction === "sol_to_bwick"
                        ? bridge.solConnected && bridge.solAddress
                          ? shortAddr(bridge.solAddress)
                          : "Connect Solana"
                        : bridge.bwickAddress
                          ? shortAddr(bridge.bwickAddress)
                          : "Connect ansemchain"}
                    </span>
                    <SelectorArrowIcon className="h-4 w-4 text-[#3fae4d] opacity-70" />
                  </button>
                </header>

                <div className="px-4">
                  <div className="relative w-fit">
                    <PayAssetSelector
                      symbol={bridge.selectedSymbol}
                      direction={bridge.direction}
                      onClick={() => {
                        setPickerMode("pay");
                        setCardView("token");
                      }}
                    />
                  </div>
                </div>

                <div className="flex w-full flex-col">
                  <div className="h-[65px] px-2 pt-1 text-[54px] font-normal text-white md:h-[75px] md:px-4">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bridge.amount}
                      onChange={(e) => bridge.setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0"
                      className="flex h-[55px] w-full items-center rounded-[10px] bg-transparent px-2 text-[54px] font-normal text-white placeholder:text-[#676b7e] focus:outline-none"
                    />
                  </div>

                  <footer className="flex h-8 items-center justify-between gap-2 px-2 text-[#676b7e] md:px-4">
                    <div className="flex h-7 items-center gap-1.5 rounded-[10px] px-2">
                      {bridge.amountError ? (
                        <span className="text-[13px] text-red-300">
                          {bridge.amountError}
                        </span>
                      ) : (
                        <>
                          <MoneyIcon />
                          <span className="flex items-center text-[#676b7e]">
                            <span className="text-[14px] opacity-70">$</span>
                            <span className="text-[14px]">{bridge.amount || "0"}</span>
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => bridge.setMaxAmount()}
                      className="flex h-7 items-center gap-1.5 rounded-[10px] px-2 transition hover:bg-[#fbfbfd1a]"
                    >
                      <span className="text-[14px] opacity-70">Max</span>
                      <span className="text-[14px]">{bridge.payBalance}</span>
                    </button>
                  </footer>
                </div>
              </section>

              <aside className="flex h-[50px] w-full items-center justify-center border-t border-[#fbfbfd1a] bg-[#17191c] px-2 py-1 text-[#676b7e] md:px-4">
                <div className="flex h-10 w-8 items-center justify-center">
                  <button
                    onClick={bridge.flip}
                    aria-label="Flip direction"
                    className="flex h-10 min-w-[60px] items-center justify-center rounded-[15px] px-2 text-[#d1d6e0] transition hover:bg-[#fbfbfd1a]"
                  >
                    <FlipArrowIcon />
                  </button>
                </div>
              </aside>

              <section className="relative flex w-full flex-col border-t border-[#fbfbfd1a] bg-[#17191c] pb-4">
                <header className="flex h-12 items-center px-4 py-1">
                  <button
                    onClick={() => setCardView("wallet")}
                    className="flex h-8 items-center gap-2 rounded-[10px] px-2 text-[#676b7e] transition hover:bg-[#fbfbfd1a]"
                  >
                    <span className="text-[17px] leading-[18px]">Receive</span>
                    <span className="text-[17px] leading-[18px] text-[#676b7e]">:</span>
                    <span className="text-[17px] leading-[18px] text-[#3fae4d]">
                      {bridge.direction === "sol_to_bwick"
                        ? bridge.bwickAddress
                          ? shortAddr(bridge.bwickAddress)
                          : "Connect ansemchain"
                        : bridge.solConnected && bridge.solAddress
                          ? shortAddr(bridge.solAddress)
                          : "Connect Solana"}
                    </span>
                  </button>
                </header>

                <div className="px-4">
                  <div className="relative w-fit">
                    <ReceiveAssetSelector
                      symbol={bridge.selectedSymbol}
                      onClick={() => {
                        setPickerMode("receive");
                        setCardView("token");
                      }}
                      direction={bridge.direction}
                    />
                  </div>
                </div>

                <div className="flex w-full flex-col">
                  <div className="h-[65px] px-2 pt-1 text-[54px] font-normal text-[#676b7e] md:h-[75px] md:px-4">
                    <div className="flex h-[55px] w-full items-center rounded-[10px] bg-transparent px-2">
                      {bridge.amount || "0"}
                    </div>
                  </div>

                  <footer className="flex h-8 items-center justify-between gap-2 px-2 text-[#676b7e] md:px-4">
                    <div className="flex h-7 items-center gap-1.5 rounded-[10px] px-2">
                      <MoneyIcon />
                      <span className="flex items-center text-[#676b7e]">
                        <span className="text-[14px] opacity-70">$</span>
                        <span className="text-[14px]">{bridge.amount || "0"}</span>
                      </span>
                    </div>
                    <div className="flex h-7 items-center gap-1.5 rounded-[10px] px-2">
                      <span className="text-[14px] opacity-70">Balance</span>
                      <span className="text-[14px]">{bridge.receiveBalance}</span>
                    </div>
                  </footer>
                </div>
              </section>

              {bridge.phase.kind !== "idle" ? (
                <div className="px-4 pb-2 pt-1">
                  <PhaseBanner phase={bridge.phase} />
                </div>
              ) : null}

              <div className="h-full max-h-[80px] px-4 pb-4">
                {(() => {
                  const walletsReady =
                    bridge.solConnected && bridge.bwickAddress;
                  const inFlight =
                    bridge.phase.kind === "submitting" ||
                    bridge.phase.kind === "solana-confirming" ||
                    bridge.phase.kind === "polling-bwick" ||
                    bridge.phase.kind === "polling-solana";
                  const allowed = !inFlight && (
                    !walletsReady || bridge.isAmountValid || bridge.phase.kind === "done"
                  );
                  const label = !walletsReady
                    ? "Connect"
                    : inFlight
                      ? bridge.phase.kind === "submitting" ||
                        bridge.phase.kind === "solana-confirming"
                        ? "Signing…"
                        : "Bridging…"
                      : bridge.phase.kind === "done"
                        ? "Bridge again"
                        : bridge.amount.trim().length === 0
                          ? "Enter an amount"
                          : bridge.amountError
                            ? bridge.amountError
                            : `Bridge ${bridge.amount} ${bridge.selectedSymbol}`;
                  return (
                    <button
                      onClick={() => {
                        if (!walletsReady) {
                          setCardView("wallet");
                          return;
                        }
                        if (bridge.isAmountValid) void bridge.submit();
                      }}
                      disabled={!allowed}
                      className="relative flex h-[56px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#0e1013] text-[#fbfbfd] transition-[background-color,opacity] duration-300 ease-out hover:bg-[#15171b] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="relative z-10 px-6 text-[22px] leading-[22px] font-normal">
                        {label}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </section>

    </main>
  );
}
