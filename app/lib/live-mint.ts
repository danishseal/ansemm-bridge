// Live bridge-asset resolver.
//
// The dApp used to hard-code a single SPL mint at build time. This module pulls
// the canonical per-asset CAs from chain Params (assets[]) at runtime, with the
// env values used only as a bootstrap fallback when the chain is unreachable.
// Multi-asset: the bridge carries CHANSE (priority) and ANSEM; each mirrors one
// SPL mint to one native denom, so the resolver returns the full asset list and
// callers pick by denom.
//
// Cached in-module for 60s so we don't hammer REST on every form keystroke.

import { PublicKey } from "@solana/web3.js";
import {
  BWICK_REST,
  BRIDGE_ASSET_META,
  assetMetaForDenom,
} from "./config";

const CACHE_TTL_MS = 60_000;

export interface BridgeLimits {
  /** Max micro-units that can be minted (Sol→chain) per tx. */
  maxMintPerTx: bigint | null;
  /** Max micro-units that can be burned (chain→Sol) per tx. */
  maxBurnPerTx: bigint | null;
}

export interface ResolvedAsset {
  symbol: string;
  denom: string;
  mint: string;
  limits: BridgeLimits;
}

interface CacheEntry {
  assets: ResolvedAsset[];
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
let inFlight: Promise<CacheEntry> | null = null;

function parseBigIntOrNull(v: unknown): bigint | null {
  if (typeof v !== "string" || v.length === 0) return null;
  try {
    return BigInt(v);
  } catch {
    return null;
  }
}

/** Bootstrap asset list from static env metadata (chain unreachable).
 * Assets whose splFallback is unset/invalid are omitted — the CHANSE mint is
 * intentionally un-pinned (resolved live from chain Params), so during an
 * outage it simply isn't offered rather than pointing at a stale CA. */
function fallbackAssets(): ResolvedAsset[] {
  return BRIDGE_ASSET_META
    .filter((m) => (m.splFallback?.length ?? 0) >= 32)
    .map((m) => ({
      symbol: m.symbol,
      denom: m.denom,
      mint: m.splFallback,
      limits: { maxMintPerTx: null, maxBurnPerTx: null },
    }));
}

async function fetchChainParams(): Promise<CacheEntry> {
  const url = `${BWICK_REST.replace(/\/$/, "")}/bridge/v1/params`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`chain params HTTP ${res.status}`);
  // Multi-asset params: assets[] is priority-ordered. Legacy single-asset
  // fields are kept as a fallback for a chain that predates assets[].
  const json = (await res.json()) as {
    params?: {
      solana_token_address?: string;
      max_mint_per_tx?: string;
      max_burn_per_tx?: string;
      assets?: Array<{
        denom?: string;
        solana_mint?: string;
        enabled?: boolean;
        max_mint_per_tx?: string;
        max_burn_per_tx?: string;
      }>;
    };
  };

  const raw = json.params?.assets;
  let assets: ResolvedAsset[];
  if (Array.isArray(raw) && raw.length > 0) {
    assets = raw
      // Only surface assets that are bridgeable now and carry a real mint.
      .filter((a) => a.enabled !== false && (a.solana_mint?.length ?? 0) >= 32)
      .map((a) => ({
        symbol: assetMetaForDenom(a.denom ?? "").symbol,
        denom: a.denom ?? "",
        mint: a.solana_mint as string,
        limits: {
          maxMintPerTx: parseBigIntOrNull(a.max_mint_per_tx),
          maxBurnPerTx: parseBigIntOrNull(a.max_burn_per_tx),
        },
      }));
  } else {
    // Legacy single-asset chain: synthesise the priority asset.
    const ca = json.params?.solana_token_address;
    if (!ca || ca.length < 32) throw new Error("chain params missing bridgeable asset mint");
    const meta = BRIDGE_ASSET_META[0];
    assets = [
      {
        symbol: meta.symbol,
        denom: meta.denom,
        mint: ca,
        limits: {
          maxMintPerTx: parseBigIntOrNull(json.params?.max_mint_per_tx),
          maxBurnPerTx: parseBigIntOrNull(json.params?.max_burn_per_tx),
        },
      },
    ];
  }

  if (assets.length === 0) throw new Error("chain params list no bridgeable assets");
  return { assets, fetchedAt: Date.now() };
}

async function loadParams(): Promise<CacheEntry> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const entry = await fetchChainParams();
      cache = entry;
      return entry;
    } catch (e) {
      console.warn(
        "[live-mint] chain Params unreachable, falling back to env CAs:",
        e instanceof Error ? e.message : e,
      );
      cache = { assets: fallbackAssets(), fetchedAt: Date.now() - CACHE_TTL_MS / 2 };
      return cache;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** All bridgeable assets (priority order). Never throws (env fallback). */
export async function getBridgeAssets(): Promise<ResolvedAsset[]> {
  return (await loadParams()).assets;
}

/** Resolve one asset by denom; falls back to the priority asset. */
export async function getAssetByDenom(denom: string): Promise<ResolvedAsset> {
  const assets = await getBridgeAssets();
  return assets.find((a) => a.denom === denom) ?? assets[0];
}

export async function getAssetMintPubkey(denom: string): Promise<PublicKey> {
  return new PublicKey((await getAssetByDenom(denom)).mint);
}

export async function getBridgeLimitsForDenom(denom: string): Promise<BridgeLimits> {
  return (await getAssetByDenom(denom)).limits;
}

// ── Back-compat: priority-asset (CHANSE) helpers ────────────────────────────
export async function getBwickMintAddress(): Promise<string> {
  return (await getBridgeAssets())[0].mint;
}

export async function getBwickMintPubkey(): Promise<PublicKey> {
  return new PublicKey(await getBwickMintAddress());
}

export async function getBridgeLimits(): Promise<BridgeLimits> {
  return (await getBridgeAssets())[0].limits;
}

/** Synchronous current-cached priority CA, or env fallback if none fetched. */
export function getBwickMintAddressSync(): string {
  return cache?.assets[0]?.mint ?? BRIDGE_ASSET_META[0].splFallback;
}
