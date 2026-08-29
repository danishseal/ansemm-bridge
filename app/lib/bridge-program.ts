// Client for the bwick_bridge Anchor program on Solana.
// Builds raw `register` and `deposit` instructions without pulling Anchor at runtime.
//
// Anchor instruction discriminator = first 8 bytes of sha256("global:<name>")
// Layouts mirror programs/bwick-bridge/src/instructions/{register,deposit}.rs

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

import {
  BRIDGE_PROGRAM_ID,
  SOLANA_RPC,
} from "./config";
import { getBwickMintPubkey } from "./live-mint";

export const SOLANA_CONNECTION = () =>
  new Connection(SOLANA_RPC, "confirmed");

/**
 * Bundled fallback. The LIVE program ID is fetched at runtime via
 * `getBridgeProgramId()` in `./live-config` so a fresh program deploy
 * does not require a dApp redeploy.
 */
export const BRIDGE_PROGRAM = new PublicKey(BRIDGE_PROGRAM_ID);

// The CHANSE mint is intentionally NOT a module-level constant: it can rotate
// via chain governance and defaults to empty, so `new PublicKey(BWICK_SPL_MINT)`
// at import time threw "Invalid public key input" and 500'd the whole page.
// Resolve it live at the point of use via `getBwickMintPubkey()` (./live-mint).

// Pre-computed Anchor discriminators (sha256("global:<name>")[0..8]).
// Verified by sha256 in node:
//   register   = d3 7c 43 0f d3 c2 b2 f0
//   deposit    = f2 23 c6 89 52 e1 f2 b6
//   withdraw   = b7 12 46 9c 94 6d a1 22 (matches relayer/pool-executor.ts)
const DISCRIM = {
  register: new Uint8Array([0xd3, 0x7c, 0x43, 0x0f, 0xd3, 0xc2, 0xb2, 0xf0]),
  deposit: new Uint8Array([0xf2, 0x23, 0xc6, 0x89, 0x52, 0xe1, 0xf2, 0xb6]),
};

// Multi-asset: there is one BridgePool PER MINT. The pool PDA is seeded
// [b"bridge_pool", mint] and the vault [b"pool_vault", mint, generation].
// A `mint` argument is therefore required for every pool derivation.
export function bridgePoolPda(
  mint: PublicKey,
  programId: PublicKey = BRIDGE_PROGRAM
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("bridge_pool"), mint.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Read the CURRENT pool_vault pubkey from the on-chain bridge_pool state.
 * The vault PDA seeds include mint_generation, which changes whenever
 * migrate_vault runs, so we read the live pubkey off the account rather than
 * deriving it. The pool account itself is per-mint (see `bridgePoolPda`).
 */
export async function getCurrentPoolVault(
  conn: import("@solana/web3.js").Connection,
  mint: PublicKey,
  programId: PublicKey = BRIDGE_PROGRAM
): Promise<PublicKey> {
  const info = await conn.getAccountInfo(bridgePoolPda(mint, programId));
  if (!info) throw new Error("bridge_pool not initialized for this mint");
  // Layout from bridge-program/src/state.rs (unchanged by multi-asset):
  //   8 disc + 5*32 admins + 1 admin_count + 1 admin_thresh
  //   + 16*32 attestors + 1 + 1 + 32 mint + 32 pool_vault + ...
  const OFF = 8 + 5 * 32 + 1 + 1 + 16 * 32 + 1 + 1 + 32; // 716
  return new PublicKey(info.data.subarray(OFF, OFF + 32));
}

export function userAccountPda(
  user: PublicKey,
  programId: PublicKey = BRIDGE_PROGRAM
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("user_account"), user.toBuffer()],
    programId
  );
  return pda;
}

// Anchor encodes a `String` arg as 4-byte LE length prefix + UTF-8 bytes.
function encodeAnchorString(s: string): Uint8Array {
  const bytes = new TextEncoder().encode(s);
  const buf = new Uint8Array(4 + bytes.length);
  new DataView(buf.buffer).setUint32(0, bytes.length, true);
  buf.set(bytes, 4);
  return buf;
}

function encodeU64LE(n: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigUint64(0, n, true);
  return buf;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/**
 * Build a `register` instruction.
 * register(bwick_chain_address: String) — opens the user_account PDA so
 * the relayer knows where to mint on bwickchain.
 */
export function buildRegisterIx(
  user: PublicKey,
  bwickChainAddress: string,
  mint: PublicKey,
  programId: PublicKey = BRIDGE_PROGRAM
): TransactionInstruction {
  const data = concatBytes(
    DISCRIM.register,
    encodeAnchorString(bwickChainAddress)
  );

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: bridgePoolPda(mint, programId), isSigner: false, isWritable: false },
      { pubkey: userAccountPda(user, programId), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

/**
 * Build a `deposit` instruction.
 * deposit(amount: u64) — transfers SPL from user ATA to pool_vault and
 * emits DepositEvent for the relayer.
 */
export function buildDepositIx(args: {
  user: PublicKey;
  userTokenAccount: PublicKey;
  amount: bigint;
  tokenProgram: PublicKey;
  /** The SPL mint being deposited — selects which per-mint pool to target. */
  mint: PublicKey;
  /** v2: must be the live pool_vault pubkey from `getCurrentPoolVault()`. */
  poolVault: PublicKey;
  /** Optional. Defaults to the env constant — tx-builder callers should
   *  pass `await getBridgeProgramId()` (from `./live-config`). */
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = args.programId ?? BRIDGE_PROGRAM;
  const data = concatBytes(DISCRIM.deposit, encodeU64LE(args.amount));

  // Account order MUST match the deployed program's `Deposit` struct
  // (instructions.rs): user, bridge_pool, user_account, owner, user_token_account,
  // pool_vault, ansem_mint, token_program. The Token-2022 fix added `owner`
  // (has_one on user_account) and `ansem_mint` (transfer_checked needs the mint);
  // omitting them misaligns the accounts and the program reads pool_vault from the
  // mint slot -> AccountOwnedByWrongProgram (3007). `owner` == user_account.owner,
  // which is the depositing user.
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.user, isSigner: true, isWritable: true },
      { pubkey: bridgePoolPda(args.mint, programId), isSigner: false, isWritable: true },
      { pubkey: userAccountPda(args.user, programId), isSigner: false, isWritable: true },
      { pubkey: args.user, isSigner: false, isWritable: false },
      { pubkey: args.userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: args.poolVault, isSigner: false, isWritable: true },
      { pubkey: args.mint, isSigner: false, isWritable: false },
      { pubkey: args.tokenProgram, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

/**
 * Detects whether the BWICK mint is owned by the legacy Token program or
 * Token-2022 (the program uses anchor-spl token_interface, so either is OK).
 * Returns the program id to pass into the deposit instruction.
 */
export async function detectTokenProgram(
  conn: Connection,
  mint: PublicKey
): Promise<PublicKey> {
  const info = await conn.getAccountInfo(mint);
  if (!info) throw new Error("BWICK mint account not found on Solana");
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  return TOKEN_PROGRAM_ID;
}

/**
 * Returns the user's ATA for the BWICK mint, plus an ix to create it if missing.
 * (Pump.fun mints are usually classic Token program; we still resolve dynamically.)
 */
export async function ensureBwickAta(
  conn: Connection,
  user: PublicKey,
  mintArg?: PublicKey
): Promise<{
  ata: PublicKey;
  tokenProgram: PublicKey;
  createIx: TransactionInstruction | null;
}> {
  const mint = mintArg ?? (await getBwickMintPubkey());
  const tokenProgram = await detectTokenProgram(conn, mint);
  const ata = getAssociatedTokenAddressSync(
    mint,
    user,
    false,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const info = await conn.getAccountInfo(ata);
  if (info) return { ata, tokenProgram, createIx: null };
  const createIx = createAssociatedTokenAccountInstruction(
    user,
    ata,
    user,
    mint,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return { ata, tokenProgram, createIx };
}

/** Returns true if a UserAccount PDA already exists for this wallet. */
export async function isUserRegistered(
  conn: Connection,
  user: PublicKey
): Promise<boolean> {
  const { getBridgeProgramId } = await import("./live-config");
  const pid = await getBridgeProgramId();
  const info = await conn.getAccountInfo(userAccountPda(user, pid));
  return info !== null;
}

/** Build (and return) a Transaction with: optional ATA-create, optional register, deposit. */
export async function buildDepositTransaction(args: {
  conn: Connection;
  user: PublicKey;
  bwickChainAddress: string;
  amount: bigint;
  /** SPL mint of the asset being bridged; defaults to the priority asset. */
  mint?: PublicKey;
}): Promise<Transaction> {
  const { conn, user, bwickChainAddress, amount } = args;
  const tx = new Transaction();

  // Fetch the LIVE bridge program ID from bwick-config; falls back to env
  // when the registry is unreachable. Never build a deposit against the
  // stale bundled constant.
  const { getBridgeProgramId } = await import("./live-config");
  const programId = await getBridgeProgramId();

  const mint = args.mint ?? (await getBwickMintPubkey());
  const { ata, tokenProgram, createIx } = await ensureBwickAta(conn, user, mint);
  if (createIx) tx.add(createIx);

  const registered = await isUserRegistered(conn, user);
  if (!registered) {
    tx.add(buildRegisterIx(user, bwickChainAddress, mint, programId));
  }

  // Vault pubkey read from the per-mint pool account (mint_generation aware).
  const poolVault = await getCurrentPoolVault(conn, mint, programId);
  tx.add(
    buildDepositIx({
      user,
      userTokenAccount: ata,
      amount,
      tokenProgram,
      mint,
      poolVault,
      programId,
    })
  );

  const { blockhash } = await conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = user;

  return tx;
}

// ── Sponsored (gasless) deposits ──────────────────────────────────────────
// The relayer pays the Solana fee + user_account rent so a wallet with zero
// SOL can still bridge in. The relayer's co-sign endpoint validates the tx
// (fee payer must be the relayer, BWICK-only, one bridge ix) before signing.

// The ansemchain relayer's sponsorship API (relayer-info + submit-tx). The old
// default `relayer.bwick.fun` is dead, so getRelayerInfo() returned null and the
// gasless path never engaged -> zero-SOL wallets hit "Insufficient Funds". Point
// at the ansemchain relayer's HTTPS front. Override with NEXT_PUBLIC_RELAYER_API_URL
// (e.g. http://195.72.61.234:3000 for local dev against val1).
const RELAYER_API =
  process.env.NEXT_PUBLIC_RELAYER_API_URL || "https://relayer.ansemchain.fun";

// sha256("global:register_sponsored")[0..8]
const DISCRIM_REGISTER_SPONSORED = new Uint8Array([
  0x32, 0x0a, 0xa8, 0xb2, 0x3c, 0xe6, 0xcf, 0xf8,
]);

export interface RelayerInfo {
  relayerPublicKey: string;
  feeSponsorshipEnabled: boolean;
}

let cachedRelayerInfo: { value: RelayerInfo; fetchedAt: number } | null = null;

/** Relayer identity + whether fee sponsorship is on. Null if unreachable. */
export async function getRelayerInfo(): Promise<RelayerInfo | null> {
  const now = Date.now();
  if (cachedRelayerInfo && now - cachedRelayerInfo.fetchedAt < 60_000) {
    return cachedRelayerInfo.value;
  }
  try {
    const res = await fetch(`${RELAYER_API}/api/bridge/relayer-info`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const value = (await res.json()) as RelayerInfo;
    if (!value.relayerPublicKey) return null;
    cachedRelayerInfo = { value, fetchedAt: now };
    return value;
  } catch {
    return null;
  }
}

/** register_sponsored: relayer (payer) funds the user_account PDA; user signs. */
export function buildRegisterSponsoredIx(args: {
  payer: PublicKey;
  user: PublicKey;
  bwickChainAddress: string;
  mint: PublicKey;
  programId: PublicKey;
}): TransactionInstruction {
  const data = concatBytes(
    DISCRIM_REGISTER_SPONSORED,
    encodeAnchorString(args.bwickChainAddress),
  );
  return new TransactionInstruction({
    programId: args.programId,
    keys: [
      { pubkey: args.payer, isSigner: true, isWritable: true },
      { pubkey: args.user, isSigner: true, isWritable: false },
      { pubkey: bridgePoolPda(args.mint, args.programId), isSigner: false, isWritable: false },
      { pubkey: userAccountPda(args.user, args.programId), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

/** A one-instruction sponsored register tx (fee payer = relayer). */
export async function buildSponsoredRegisterTransaction(args: {
  conn: Connection;
  user: PublicKey;
  relayer: PublicKey;
  bwickChainAddress: string;
}): Promise<Transaction> {
  const { getBridgeProgramId } = await import("./live-config");
  const programId = await getBridgeProgramId();
  const mint = await getBwickMintPubkey();
  const tx = new Transaction();
  tx.add(
    buildRegisterSponsoredIx({
      payer: args.relayer,
      user: args.user,
      bwickChainAddress: args.bwickChainAddress,
      mint,
      programId,
    }),
  );
  const { blockhash } = await args.conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = args.relayer;
  return tx;
}

/** A one-instruction sponsored deposit tx (fee payer = relayer). Assumes the
 *  user is already registered (call buildSponsoredRegisterTransaction first). */
export async function buildSponsoredDepositTransaction(args: {
  conn: Connection;
  user: PublicKey;
  relayer: PublicKey;
  amount: bigint;
  /** SPL mint of the asset being bridged; defaults to the priority asset. */
  mint?: PublicKey;
}): Promise<Transaction> {
  const { getBridgeProgramId } = await import("./live-config");
  const programId = await getBridgeProgramId();
  const mint = args.mint ?? (await getBwickMintPubkey());
  const tokenProgram = await detectTokenProgram(args.conn, mint);
  const ata = getAssociatedTokenAddressSync(
    mint,
    args.user,
    false,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const poolVault = await getCurrentPoolVault(args.conn, mint, programId);
  const tx = new Transaction();
  tx.add(
    buildDepositIx({
      user: args.user,
      userTokenAccount: ata,
      amount: args.amount,
      tokenProgram,
      mint,
      poolVault,
      programId,
    }),
  );
  const { blockhash } = await args.conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = args.relayer;
  return tx;
}

/** POST a user-partial-signed tx to the relayer's co-sign endpoint. The relayer
 *  adds its signature (fee payer) and submits, returning the signature. */
export async function submitSponsoredTx(signed: Transaction): Promise<string> {
  const raw = signed.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const transaction = Buffer.from(raw).toString("base64");
  const res = await fetch(`${RELAYER_API}/api/bridge/submit-tx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    signature?: string;
    error?: string;
  };
  if (!res.ok || !body.signature) {
    throw new Error(body.error || `sponsor submit failed (HTTP ${res.status})`);
  }
  return body.signature;
}
