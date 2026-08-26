// Wallet detection / connection shared across the bwickchain dApps.
//
// Two compatible providers:
//   1. window.bwickWallet.cosmos — the BWICK Wallet extension's native Keplr-shaped surface.
//   2. window.keplr             — the standalone Keplr extension.
//
// When both are present, callers can let the user pick by passing `kind`
// to `connectWallet`; default behaviour falls back to the first one found
// in preference order (BWICK → Keplr).

import type { OfflineSigner } from "@cosmjs/proto-signing";

export type WalletKind = "bwick" | "keplr";

export interface WalletOption {
  kind: WalletKind;
  /** Human label shown in pickers. */
  label: string;
}

interface KeplrLikeProvider {
  experimentalSuggestChain(info: unknown): Promise<void>;
  enable(chainId: string | string[]): Promise<void>;
  getOfflineSigner(chainId: string): OfflineSigner;
  getKey(
    chainId: string
  ): Promise<{ name: string; bech32Address: string }>;
}

declare global {
  interface Window {
    bwickWallet?: { cosmos?: KeplrLikeProvider };
  }
}

function providerForKind(
  kind: WalletKind
): KeplrLikeProvider | null {
  if (typeof window === "undefined") return null;
  if (kind === "bwick") return window.bwickWallet?.cosmos ?? null;
  return (window as unknown as { keplr?: KeplrLikeProvider }).keplr ?? null;
}

/** Every Cosmos-capable wallet currently injected into the page. */
export function availableProviders(): WalletOption[] {
  const out: WalletOption[] = [];
  if (providerForKind("bwick")) {
    out.push({ kind: "bwick", label: "BWICK Wallet" });
  }
  if (providerForKind("keplr")) {
    out.push({ kind: "keplr", label: "Keplr" });
  }
  return out;
}

/** Default kind used by `connectWallet()` when caller doesn't pin one. */
function pickDefault(): WalletKind | null {
  const opts = availableProviders();
  return opts[0]?.kind ?? null;
}

/** True when at least one Cosmos-capable wallet is injected. */
export function hasCosmosWallet(): boolean {
  return availableProviders().length > 0;
}

/** Which wallet would be used by `connectWallet()` if no kind is passed. */
export function detectWalletKind(): WalletKind | null {
  return pickDefault();
}

export interface ConnectedWallet {
  address: string;
  name: string;
  signer: OfflineSigner;
  kind: WalletKind;
}

export async function connectWallet(args: {
  chainInfo: unknown;
  chainId: string;
  /** Explicit choice when both providers are installed. */
  kind?: WalletKind;
}): Promise<ConnectedWallet> {
  const chosen = args.kind ?? pickDefault();
  if (!chosen) {
    throw new Error(
      "No Cosmos wallet detected. Install the BWICK Wallet extension or Keplr."
    );
  }
  const provider = providerForKind(chosen);
  if (!provider) {
    throw new Error(
      `${chosen === "bwick" ? "BWICK Wallet" : "Keplr"} not detected.`
    );
  }
  try {
    await provider.experimentalSuggestChain(args.chainInfo);
  } catch (err) {
    // Some wallets reject if the chain is already known — non-fatal.
    console.warn("suggestChain warning:", err);
  }
  await provider.enable(args.chainId);
  const signer = provider.getOfflineSigner(args.chainId);
  const key = await provider.getKey(args.chainId);
  return { address: key.bech32Address, name: key.name, signer, kind: chosen };
}
