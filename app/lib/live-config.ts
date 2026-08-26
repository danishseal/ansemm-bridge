// Live bwick-config registry resolver.
//
// Mirrors the Chrome extension's lookup: query the bwick-config CW
// contract at runtime for every mutable address (bridge program ID,
// SPL mint, etc.). On error, fall back to chain Params, then bundled env.
//
// The dApp redeploys in ~2 min via Vercel, so technically it doesn't
// need hot-swap as urgently as the extension. But running the same
// lookup chain means a single admin UpdateConfig flips both surfaces
// simultaneously — no coordinated redeploy.

import { PublicKey } from "@solana/web3.js";
import { BWICK_REST, BRIDGE_PROGRAM_ID as ENV_BRIDGE_PROGRAM_ID } from "./config";

// The ONE mutable-address anchor baked at build time (with the REST endpoint).
// Default = the current live ansem-1 config registry. Genesis-proof launch value
// (instantiate2 + fixed salt, survives regenesis):
//   ansem1uruc2ue7wqvy83yysspe6afrwu02fuz4g0mxffuz3tssljakxu0qt57u4l
const REGISTRY_CONTRACT =
  process.env.NEXT_PUBLIC_ANSEM_REGISTRY ??
  "ansem1vguuxez2h5ekltfj9gjd62fs5k4rl2zy5hfrncasykzw08rezpfs766uxe";

export interface BwickConfig {
  version: number;
  ammContract: string;
  launchpadContract: string;
  oracleContract: string;
  vestingCodeId: number;
  namesContract: string;
  solanaBridgeProgramId: string;
  solanaAnsemSplMint: string;
  solanaRpcUrlOverride: string;
  ansemRpcUrlOverride: string;
  ansemRestUrlOverride: string;
}

const CACHE_TTL_MS = 60_000;
let cache: { value: BwickConfig; fetchedAt: number } | null = null;
let inFlight: Promise<BwickConfig> | null = null;

function b64(s: string): string {
  if (typeof btoa === "function") return btoa(s);
  return Buffer.from(s, "utf-8").toString("base64");
}

async function fetchConfig(): Promise<BwickConfig> {
  const query = b64(JSON.stringify({ config: {} }));
  const url = `${BWICK_REST.replace(/\/$/, "")}/cosmwasm/wasm/v1/contract/${REGISTRY_CONTRACT}/smart/${query}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`config registry HTTP ${res.status}`);
  const json = (await res.json()) as { data?: Record<string, unknown> };
  const d = json.data;
  if (!d) throw new Error("config registry response missing data");
  return {
    version: Number(d.version ?? 0),
    ammContract: String(d.amm_contract ?? ""),
    launchpadContract: String(d.launchpad_contract ?? ""),
    oracleContract: String(d.oracle_contract ?? ""),
    vestingCodeId: Number(d.vesting_code_id ?? 0),
    namesContract: String(d.names_contract ?? ""),
    solanaBridgeProgramId: String(d.solana_bridge_program_id ?? ""),
    solanaAnsemSplMint: String(d.solana_ansem_spl_mint ?? ""),
    solanaRpcUrlOverride: String(d.solana_rpc_url_override ?? ""),
    ansemRpcUrlOverride: String(d.ansem_rpc_url_override ?? ""),
    ansemRestUrlOverride: String(d.ansem_rest_url_override ?? ""),
  };
}

export async function loadBwickConfig(): Promise<BwickConfig> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.value;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const value = await fetchConfig();
      cache = { value, fetchedAt: Date.now() };
      return value;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Resolve the live Solana bridge program ID. Registry first, env fallback. */
export async function getBridgeProgramId(): Promise<PublicKey> {
  try {
    const cfg = await loadBwickConfig();
    if (cfg.solanaBridgeProgramId.length >= 32) {
      return new PublicKey(cfg.solanaBridgeProgramId);
    }
  } catch {
    /* fall through */
  }
  return new PublicKey(ENV_BRIDGE_PROGRAM_ID);
}

/** ANSEM SPL mint from the registry, if the caller wants a non-params source.
 *  NOTE: the bridge's primary mint source is chain Params (/bridge/v1/params via
 *  live-mint.ts), which is authoritative and genesis-stable; this is a fallback. */
export async function getAnsemSplMintOverride(): Promise<string | null> {
  try {
    const m = (await loadBwickConfig()).solanaAnsemSplMint;
    return m.length >= 32 ? m : null;
  } catch {
    return null;
  }
}
