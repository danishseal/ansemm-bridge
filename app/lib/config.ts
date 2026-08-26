// Centralized env config. All values must be NEXT_PUBLIC_* so they are
// inlined at build time and visible in the browser bundle.

export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "bwick-1";
// IMPORTANT: must be HTTPS. The dApp is served over https, so an http:// (or
// bare-IP) endpoint is blocked by the browser as mixed content and every chain
// call fails with "Failed to fetch" (including the extension connect). The
// bare IP http://167.99.147.85 has no TLS; use the TLS-terminated domains.
export const BWICK_RPC =
  process.env.NEXT_PUBLIC_BWICK_RPC ?? "https://rpc.bwick.fun";
export const BWICK_REST =
  process.env.NEXT_PUBLIC_BWICK_REST ?? "https://rest.bwick.fun";
export const BWICK_DENOM = process.env.NEXT_PUBLIC_BWICK_DENOM ?? "ubwick";
export const BWICK_DECIMALS = Number(
  process.env.NEXT_PUBLIC_BWICK_DECIMALS ?? "6"
);

// We previously defaulted to api.mainnet-beta.solana.com, but the public
// endpoint returns 403 on browser-origin getAccountInfo calls so the dApp
// can't read the mint without a real provider. Helius URL below is the
// operator's own key (same value as the local .env.local) - keep this in
// sync with whichever RPC you've baked into deploys. Override in
// .env.local for local dev.
export const SOLANA_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC ??
  "https://mainnet.helius-rpc.com/?api-key=52c98816-cbe0-465d-b110-3d2d32cb46e9";
export const BWICK_SPL_MINT =
  process.env.NEXT_PUBLIC_BWICK_SPL_MINT ??
  "tZJPq6qRfHCxqZWCjkCCM3FaK73wyKsTeWDdLZQpump";
export const BRIDGE_PROGRAM_ID =
  process.env.NEXT_PUBLIC_BRIDGE_PROGRAM_ID ??
  "F6Y1rD5oTrxjs7xS8h4ZPrvbBpb5CwCZZK3GEg7gKe9C";
export const RELAYER_BWICK_ADDRESS =
  process.env.NEXT_PUBLIC_RELAYER_BWICK_ADDRESS ??
  "bwick16lfwdy2ljcnrqx6sladq0v3cls2xcknkng9h2x";

// ── Multi-asset bridge ──────────────────────────────────────────────────────
// The bridge carries two assets: the priority asset (CHANSE, the gas denom)
// and ANSEM. Each mirrors one Solana SPL mint to one native denom. The live
// mint per asset is resolved from chain Params (assets[]) at runtime; the env
// values below are only the bootstrap fallback when the chain is unreachable.
export const ANSEM_DENOM = process.env.NEXT_PUBLIC_ANSEM_DENOM ?? "uansem";
export const ANSEM_SPL_MINT =
  process.env.NEXT_PUBLIC_ANSEM_SPL_MINT ??
  "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

/** One bridgeable asset's static metadata. mint/limits come live from Params. */
export interface BridgeAssetMeta {
  symbol: string;
  denom: string;
  /** Bootstrap SPL mint when chain Params are unreachable. */
  splFallback: string;
  decimals: number;
}

/** Priority order: index 0 (CHANSE, gas) is the default and back-compat asset. */
export const BRIDGE_ASSET_META: BridgeAssetMeta[] = [
  { symbol: "CHANSE", denom: BWICK_DENOM, splFallback: BWICK_SPL_MINT, decimals: BWICK_DECIMALS },
  { symbol: "ANSEM", denom: ANSEM_DENOM, splFallback: ANSEM_SPL_MINT, decimals: BWICK_DECIMALS },
];

export function assetMetaForDenom(denom: string): BridgeAssetMeta {
  return BRIDGE_ASSET_META.find((a) => a.denom === denom) ?? BRIDGE_ASSET_META[0];
}

export function symbolForDenom(denom: string): string {
  return assetMetaForDenom(denom).symbol;
}

// Explorer base URL. When running from a localhost origin (dev / demo),
// auto-route to the local explorer on :3004 so tx links don't leave the
// machine. In any other origin (deployed), fall back to the configured
// production explorer.
const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.ansemchain.fun";

export function explorerBaseUrl(): string {
  // Always the real ansemchain explorer. (The old local-origin special-case
  // pointed at a local explorer that isn't running, so tx links were dead.)
  return EXPLORER_URL;
}

export function explorerTxUrl(hash: string): string {
  return `${explorerBaseUrl()}/tx/${hash}`;
}

export function explorerAccountUrl(addr: string): string {
  return `${explorerBaseUrl()}/account/${addr}`;
}

// Keplr ChainInfo payload for `window.keplr.experimentalSuggestChain`.
// Matches the bwickchain config in the launchpad / chain genesis.
export const KEPLR_CHAIN_INFO = {
  chainId: CHAIN_ID,
  chainName: "bwickchain",
  rpc: BWICK_RPC,
  rest: BWICK_REST,
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: "bwick",
    bech32PrefixAccPub: "bwickpub",
    bech32PrefixValAddr: "bwickvaloper",
    bech32PrefixValPub: "bwickvaloperpub",
    bech32PrefixConsAddr: "bwickvalcons",
    bech32PrefixConsPub: "bwickvalconspub",
  },
  currencies: [
    {
      coinDenom: "BWICK",
      coinMinimalDenom: BWICK_DENOM,
      coinDecimals: BWICK_DECIMALS,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "BWICK",
      coinMinimalDenom: BWICK_DENOM,
      coinDecimals: BWICK_DECIMALS,
      gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
    },
  ],
  stakeCurrency: {
    coinDenom: "BWICK",
    coinMinimalDenom: BWICK_DENOM,
    coinDecimals: BWICK_DECIMALS,
  },
  features: ["cosmwasm"],
};
