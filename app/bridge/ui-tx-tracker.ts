"use client";

const KEY = "bwick-bridge-ui-txs";
const CAP = 200;

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function save(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-CAP)));
  } catch {
    /* ignore quota / private-mode */
  }
}

export function tagUiTx(hash: string | null | undefined) {
  if (!hash) return;
  const list = load();
  if (list.includes(hash)) return;
  list.push(hash);
  save(list);
}

export function isUiTx(...hashes: Array<string | null | undefined>): boolean {
  const list = new Set(load());
  return hashes.some((h) => Boolean(h) && list.has(h!));
}
