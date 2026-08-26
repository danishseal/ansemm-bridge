import { BWICK_DECIMALS } from "./config";

/**
 * Convert a human-readable BWICK amount string ("12.345") to its base-unit
 * representation (`ubwick`, integer string). Throws on invalid input.
 */
export function toBaseUnits(amount: string, decimals = BWICK_DECIMALS): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Invalid amount");
  }
  const [whole, fracRaw = ""] = trimmed.split(".");
  if (fracRaw.length > decimals) {
    throw new Error(`Too many decimal places (max ${decimals})`);
  }
  const frac = fracRaw.padEnd(decimals, "0");
  const combined = (whole + frac).replace(/^0+/, "") || "0";
  return BigInt(combined);
}

/** Format base-units as a human-readable string with up to `decimals` digits. */
export function fromBaseUnits(
  amount: bigint | string | number,
  decimals = BWICK_DECIMALS
): string {
  const big = typeof amount === "bigint" ? amount : BigInt(amount);
  const negative = big < BigInt(0);
  const abs = negative ? -big : big;
  const s = abs.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals).replace(/0+$/, "");
  return (negative ? "-" : "") + (frac ? `${whole}.${frac}` : whole);
}

/** Truncate an address for display. */
export function shortAddr(addr: string, head = 6, tail = 6): string {
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
