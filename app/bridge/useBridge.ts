"use client";

// All bridge wiring for app/bridge/page.tsx. Keeps the visual page
// thin: state + handlers + balance polls live here, the page just
// reads from this hook.

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { SigningStargateClient } from "@cosmjs/stargate";

import {
  broadcastBurnForBridgeOut,
  fetchBwickBalance,
  fetchLatestHeight,
  findMintForRecipient,
  makeSigningClient,
} from "@/app/lib/bwickchain";
import {
  SOLANA_CONNECTION,
  buildDepositTransaction,
  detectTokenProgram,
  getRelayerInfo,
  isUserRegistered,
  buildSponsoredRegisterTransaction,
  buildSponsoredDepositTransaction,
  submitSponsoredTx,
} from "@/app/lib/bridge-program";
import {
  getAssetMintPubkey,
  getBridgeAssets,
  getBridgeLimitsForDenom,
  type BridgeLimits,
  type ResolvedAsset,
} from "@/app/lib/live-mint";
import {
  availableProviders,
  connectWallet,
  type WalletKind,
} from "@/app/lib/wallet";
import {
  CHAIN_ID,
  KEPLR_CHAIN_INFO,
  BRIDGE_ASSET_META,
  symbolForDenom,
} from "@/app/lib/config";
import { fromBaseUnits, toBaseUnits } from "@/app/lib/format";
import { tagUiTx } from "./ui-tx-tracker";

export type Direction = "sol_to_bwick" | "bwick_to_sol";

export type Phase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "solana-confirming"; signature: string }
  | { kind: "polling-bwick"; signature: string; baseline: bigint }
  | { kind: "polling-solana"; bwickTx: string; baseline: bigint; solanaTx?: string | null }
  | { kind: "done"; primaryTx: string; sisterTx: string | null; arrived: boolean; direction: Direction; amount: string }
  | { kind: "error"; message: string };

// ansemchain bech32 addresses ("ansem1..."). Was matching the old "bwick1"
// prefix, so a connected ansem1 wallet failed validation and the deposit form
// wrongly claimed no wallet was connected.
const BWICK_REGEX =
  /^ansem1[02-9ac-hj-np-z]{38}([02-9ac-hj-np-z]{20})?$/;
const SOL_PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function extractError(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as { message?: unknown };
    if (typeof e.message === "string") return e.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function useBridge() {
  // ── Solana side (wallet-adapter) ──────────────────────────
  const { publicKey, connected, connect: solConnect, disconnect: solDisconnect, wallet, sendTransaction, select, wallets } =
    useWallet();
  const { connection } = useConnection();

  // ── BWICK chain side (Keplr / BWICK Wallet) ──────────────
  const [bwickAddress, setBwickAddress] = useState<string | null>(null);
  const [bwickClient, setBwickClient] = useState<SigningStargateClient | null>(
    null,
  );
  const [bwickWalletKind, setBwickWalletKind] = useState<
    "bwick" | "keplr" | null
  >(null);

  // ── form state ────────────────────────────────────────────
  const [direction, setDirection] = useState<Direction>("sol_to_bwick");
  const [amount, setAmountRaw] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  // ── asset selection (multi-asset: CHANSE priority, ANSEM) ─
  const [selectedDenom, setSelectedDenomRaw] = useState<string>(
    BRIDGE_ASSET_META[0].denom,
  );
  const [assets, setAssets] = useState<ResolvedAsset[]>([]);
  // Load the live bridgeable asset list once; used to render the picker.
  useEffect(() => {
    let cancelled = false;
    void getBridgeAssets()
      .then((list) => {
        if (cancelled) return;
        setAssets(list);
        // If the current selection isn't actually bridgeable, snap to priority.
        if (list.length && !list.some((a) => a.denom === selectedDenom)) {
          setSelectedDenomRaw(list[0].denom);
        }
      })
      .catch(() => { /* keep static META for the picker */ });
    return () => {
      cancelled = true;
    };
  }, [selectedDenom]);

  // Switching asset clears a stale banner and resets the amount.
  const setSelectedDenom = useCallback((denom: string) => {
    setSelectedDenomRaw(denom);
    setAmountRaw("");
    setPhase((p) => (p.kind === "error" || p.kind === "done" ? { kind: "idle" } : p));
  }, []);

  // Any user edit to the amount clears a stale error/done banner so the
  // submit button reflects the new attempt cleanly.
  const setAmount = useCallback((v: string) => {
    setAmountRaw(v);
    setPhase((p) => (p.kind === "error" || p.kind === "done" ? { kind: "idle" } : p));
  }, []);

  // ── balances ──────────────────────────────────────────────
  const [splBalance, setSplBalance] = useState<bigint | null>(null);
  const [bwickBalance, setBwickBalance] = useState<bigint | null>(null);

  // Chain-params per-tx caps. Fetched once on mount + refreshed every 60s
  // via the live-mint cache.
  const [limits, setLimits] = useState<BridgeLimits>({
    maxMintPerTx: null,
    maxBurnPerTx: null,
  });
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void getBridgeLimitsForDenom(selectedDenom)
        .then((l) => {
          if (!cancelled) setLimits(l);
        })
        .catch(() => { /* fallback nulls already set */ });
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [selectedDenom]);

  // Solana SPL balance
  useEffect(() => {
    let cancelled = false;
    setSplBalance(null);
    if (!publicKey) return;
    (async () => {
      try {
        const mint = await getAssetMintPubkey(selectedDenom);
        const tokenProgram = await detectTokenProgram(connection, mint);
        const ata = getAssociatedTokenAddressSync(
          mint,
          publicKey,
          false,
          tokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        const acc = await getAccount(connection, ata, "confirmed", tokenProgram);
        if (!cancelled) setSplBalance(BigInt(acc.amount.toString()));
      } catch {
        if (!cancelled) setSplBalance(BigInt(0));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection, phase.kind, selectedDenom]);

  // BWICK chain balance
  useEffect(() => {
    let cancelled = false;
    setBwickBalance(null);
    if (!bwickAddress) return;
    (async () => {
      try {
        const bal = await fetchBwickBalance(bwickAddress, selectedDenom);
        if (!cancelled) setBwickBalance(bal);
      } catch {
        if (!cancelled) setBwickBalance(BigInt(0));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bwickAddress, phase.kind, selectedDenom]);

  // ── wallet connect helpers ───────────────────────────────
  const connectSolana = useCallback(
    async (walletName?: string) => {
      try {
        if (walletName) {
          const w = wallets.find((x) => x.adapter.name === walletName);
          if (w) {
            // If a different wallet was previously selected, tear down
            // its session so the new one starts clean.
            if (wallet?.adapter && wallet.adapter.name !== walletName) {
              try {
                await wallet.adapter.disconnect();
              } catch {
                /* ignore */
              }
            }
            select(w.adapter.name);
            // `select()` is async-via-state; the WalletProvider only
            // attaches its connect/publicKey listeners after the next
            // render commits. Defer one frame so the provider observes
            // the connect event we're about to trigger.
            await new Promise<void>((resolve) =>
              typeof window !== "undefined" && "requestAnimationFrame" in window
                ? window.requestAnimationFrame(() => resolve())
                : setTimeout(resolve, 16),
            );
            // Also defer past the React state commit explicitly.
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            // Use the hook's connect so the provider tracks the result
            // and publicKey / connected actually update in React state.
            await solConnect();
            return;
          }
        }
        await solConnect();
      } catch (err) {
        setPhase({ kind: "error", message: extractError(err) });
      }
    },
    [wallets, wallet, select, solConnect],
  );

  const connectBwick = useCallback(
    async (kind?: WalletKind, opts?: { silent?: boolean }) => {
      try {
        const { signer, address, kind: resolvedKind } = await connectWallet({
          chainInfo: KEPLR_CHAIN_INFO,
          chainId: CHAIN_ID,
          kind,
        });
        const c = await makeSigningClient(signer);
        setBwickClient(c);
        setBwickAddress(address);
        setBwickWalletKind(resolvedKind);
        try {
          window.localStorage.setItem("bwick-bridge-bwick-kind", resolvedKind);
        } catch { /* quota / private-mode */ }
      } catch (err) {
        // Silent reconnects on mount shouldn't surface errors as phase=error
        // — the user didn't ask for a connection right now.
        if (!opts?.silent) {
          setPhase({ kind: "error", message: extractError(err) });
        }
      }
    },
    [],
  );

  const disconnectAll = useCallback(() => {
    void solDisconnect();
    setBwickClient(null);
    setBwickAddress(null);
    setBwickWalletKind(null);
    try {
      window.localStorage.removeItem("bwick-bridge-bwick-kind");
    } catch { /* ignore */ }
  }, [solDisconnect]);

  // Auto-reconnect bwickchain on mount when a prior session left a kind hint
  // and the matching provider is still injected. enable() is a no-op when the
  // chain is already approved, so this is silent for the user.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (bwickAddress) return;
    let kind: WalletKind | null = null;
    try {
      const raw = window.localStorage.getItem("bwick-bridge-bwick-kind");
      if (raw === "bwick" || raw === "keplr") kind = raw;
    } catch { /* ignore */ }
    if (!kind) return;
    void connectBwick(kind, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to the user switching accounts inside Keplr / BWICK Wallet. Both
  // dispatch `keplr_keystorechange` on the window; refetch the address from
  // whichever provider we're using so the displayed address stays in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!bwickWalletKind) return;
    const onKeystoreChange = () => {
      void connectBwick(bwickWalletKind, { silent: true });
    };
    window.addEventListener("keplr_keystorechange", onKeystoreChange);
    return () => {
      window.removeEventListener("keplr_keystorechange", onKeystoreChange);
    };
  }, [bwickWalletKind, connectBwick]);

  // ── direction toggle ─────────────────────────────────────
  const flip = useCallback(() => {
    setDirection((d) =>
      d === "sol_to_bwick" ? "bwick_to_sol" : "sol_to_bwick",
    );
    setPhase({ kind: "idle" });
  }, []);

  // ── submit ───────────────────────────────────────────────
  const submit = useCallback(async () => {
    let amountBase: bigint;
    try {
      amountBase = toBaseUnits(amount);
      if (amountBase <= BigInt(0)) throw new Error("Amount must be > 0");
    } catch (err) {
      setPhase({ kind: "error", message: extractError(err) });
      return;
    }

    if (direction === "sol_to_bwick") {
      if (!publicKey) {
        setPhase({ kind: "error", message: "Connect a Solana wallet first." });
        return;
      }
      if (!bwickAddress || !BWICK_REGEX.test(bwickAddress)) {
        setPhase({
          kind: "error",
          message: "Connect an ansemchain wallet to receive the minted tokens.",
        });
        return;
      }
      try {
        setPhase({ kind: "submitting" });
        const baseline = await fetchBwickBalance(bwickAddress).catch(
          () => BigInt(0),
        );
        const adapter = wallet?.adapter;
        if (!adapter) {
          throw new Error("No Solana wallet adapter available.");
        }
        // Make sure the adapter session is open. Standard-wallet adapters
        // (BWICK Wallet, Backpack, etc.) can report `connected: true` from
        // auto-discovery while their internal account binding is null,
        // which makes sendTransaction throw "not connected".
        try {
          await adapter.connect();
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message.toLowerCase() : "";
          if (msg && !msg.includes("already")) {
            throw new Error("Solana wallet not connected. Reconnect and retry.");
          }
        }
        const signer = adapter as unknown as {
          signTransaction?: <T extends Transaction | VersionedTransaction>(
            tx: T,
          ) => Promise<T>;
        };

        let signature: string | null = null;

        // Gasless path: the relayer co-signs as fee payer and covers the
        // user_account rent, so a wallet with zero SOL can still bridge in.
        // register_sponsored and deposit must be separate txs (the relayer
        // validator allows exactly one bridge instruction per tx).
        const relayerInfo = await getRelayerInfo().catch(() => null);
        // Prefer self-pay when the user has enough SOL. The sponsored path hands
        // the wallet a relayer-fee-payer / co-signed tx that some wallets refuse
        // to sign ("could not resolve signature of a signed transaction"); a
        // plain user-fee-payer tx signs cleanly. Only fall back to the gasless
        // sponsored path for wallets with (near) zero SOL.
        const userSol = await connection.getBalance(publicKey).catch(() => 0);
        // ~0.003 SOL: enough for tx fees + the user_account registration PDA rent.
        const hasSol = userSol >= 3_000_000;
        if (
          !hasSol &&
          relayerInfo?.feeSponsorshipEnabled &&
          typeof signer.signTransaction === "function"
        ) {
          try {
            const relayer = new PublicKey(relayerInfo.relayerPublicKey);
            if (!(await isUserRegistered(connection, publicKey))) {
              const regTx = await buildSponsoredRegisterTransaction({
                conn: connection,
                user: publicKey,
                relayer,
                bwickChainAddress: bwickAddress,
              });
              const signedReg = await signer.signTransaction(regTx);
              const regSig = await submitSponsoredTx(signedReg);
              const bh = await connection.getLatestBlockhash();
              await connection.confirmTransaction(
                { signature: regSig, ...bh },
                "confirmed",
              );
            }
            const depTx = await buildSponsoredDepositTransaction({
              conn: connection,
              user: publicKey,
              relayer,
              amount: amountBase,
              mint: await getAssetMintPubkey(selectedDenom),
            });
            const signedDep = await signer.signTransaction(depTx);
            signature = await submitSponsoredTx(signedDep);
          } catch (sponsorErr) {
            // Relayer down / rate-limited / out of SOL: fall back to self-pay
            // (works only if the user has SOL). Not a hard error yet.
            console.warn("sponsored deposit failed, falling back to self-pay:", sponsorErr);
            signature = null;
          }
        }

        // Self-pay fallback: the user signs and pays their own Solana fee.
        if (signature === null) {
          const tx = await buildDepositTransaction({
            conn: connection,
            user: publicKey,
            bwickChainAddress: bwickAddress,
            amount: amountBase,
            mint: await getAssetMintPubkey(selectedDenom),
          });
          const trySend = () => adapter.sendTransaction(tx, connection);
          try {
            signature = await trySend();
          } catch (sendErr: unknown) {
            const msg =
              sendErr instanceof Error ? sendErr.message.toLowerCase() : "";
            if (msg.includes("not connected")) {
              try {
                await adapter.disconnect();
              } catch {
                /* ignore */
              }
              await adapter.connect();
              signature = await trySend();
            } else if (typeof signer.signTransaction === "function") {
              const signed = await signer.signTransaction(tx);
              signature = await connection.sendRawTransaction(
                signed.serialize(),
              );
            } else {
              throw sendErr;
            }
          }
        }

        if (!signature) {
          throw new Error("Failed to submit the deposit transaction.");
        }
        tagUiTx(signature);
        setPhase({ kind: "solana-confirming", signature });
        const blockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature, ...blockhash },
          "confirmed",
        );
        setPhase({ kind: "polling-bwick", signature, baseline });

        const startHeight = await fetchLatestHeight().catch(() => 0);
        const expected = baseline + amountBase;
        const deadline = Date.now() + 5 * 60 * 1000;
        let mintTx: string | null = null;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 5000));
          try {
            const hit = await findMintForRecipient(bwickAddress, startHeight);
            if (hit) {
              mintTx = hit.txHash;
              break;
            }
          } catch { /* ignore */ }
          try {
            const cur = await fetchBwickBalance(bwickAddress);
            if (cur >= expected) break;
          } catch { /* ignore */ }
        }
        setPhase({
          kind: "done",
          primaryTx: signature,
          sisterTx: mintTx,
          arrived: true,
          direction: "sol_to_bwick",
          amount,
        });
      } catch (err) {
        setPhase({ kind: "error", message: extractError(err) });
      }
    } else {
      // bwick_to_sol
      if (!bwickClient || !bwickAddress) {
        setPhase({
          kind: "error",
          message: "Connect an ansemchain wallet first.",
        });
        return;
      }
      if (!publicKey) {
        setPhase({
          kind: "error",
          message: "Connect a Solana wallet to receive the released SPL.",
        });
        return;
      }
      const solRecipient = publicKey.toBase58();
      if (!SOL_PUBKEY_REGEX.test(solRecipient)) {
        setPhase({
          kind: "error",
          message: "Connected Solana address looks invalid.",
        });
        return;
      }
      try {
        setPhase({ kind: "submitting" });
        const conn = SOLANA_CONNECTION();
        const mint = await getAssetMintPubkey(selectedDenom);
        const tokenProgram = await detectTokenProgram(conn, mint);
        const ata = getAssociatedTokenAddressSync(
          mint,
          publicKey,
          true,
          tokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        let baseline = BigInt(0);
        try {
          const acc = await getAccount(conn, ata, "confirmed", tokenProgram);
          baseline = BigInt(acc.amount.toString());
        } catch { /* ATA likely doesn't exist; relayer creates it */ }

        const result = await broadcastBurnForBridgeOut({
          client: bwickClient,
          sender: bwickAddress,
          amount: amountBase,
          solanaAddress: solRecipient,
          denom: selectedDenom,
        });
        if (result.code !== 0) {
          throw new Error(
            `bwickchain tx failed: ${result.rawLog ?? `code ${result.code}`}`,
          );
        }
        tagUiTx(result.transactionHash);
        setPhase({
          kind: "polling-solana",
          bwickTx: result.transactionHash,
          baseline,
        });

        const expected = baseline + amountBase;
        const deadline = Date.now() + 5 * 60 * 1000;
        const submitTime = Math.floor(Date.now() / 1000);
        let arrived = false;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 6000));
          try {
            const acc = await getAccount(conn, ata, "confirmed", tokenProgram);
            if (BigInt(acc.amount.toString()) >= expected) {
              arrived = true;
              break;
            }
          } catch { /* keep polling */ }
        }
        // Look up the Solana signature the relayer used to release the
        // tokens to the user's ATA so we can surface it in the banner.
        let relayerTx: string | null = null;
        if (arrived) {
          try {
            const sigs = await conn.getSignaturesForAddress(ata, { limit: 5 });
            // Pick the most recent confirmed signature that landed after
            // the burn was submitted (older entries belong to prior txs).
            const candidate = sigs.find(
              (s) =>
                (s.confirmationStatus === "confirmed" ||
                  s.confirmationStatus === "finalized") &&
                typeof s.blockTime === "number" &&
                s.blockTime >= submitTime - 5,
            );
            relayerTx = candidate?.signature ?? sigs[0]?.signature ?? null;
          } catch { /* best-effort */ }
        }
        setPhase({
          kind: "done",
          primaryTx: result.transactionHash,
          sisterTx: relayerTx,
          arrived,
          direction: "bwick_to_sol",
          amount,
        });
      } catch (err) {
        setPhase({ kind: "error", message: extractError(err) });
      }
    }
  }, [
    direction,
    amount,
    publicKey,
    bwickAddress,
    bwickClient,
    connection,
    sendTransaction,
    wallet,
    selectedDenom,
  ]);

  return {
    // wallets
    solAddress: publicKey?.toBase58() ?? null,
    solConnected: connected,
    solWalletName: wallet?.adapter.name ?? null,
    bwickAddress,
    bwickWalletKind,
    bwickProvidersAvailable: () => availableProviders(),
    connectSolana,
    connectBwick,
    disconnectAll,

    // form
    direction,
    flip,
    amount,
    setAmount,
    splBalance,
    bwickBalance,
    phase,
    submit,

    // asset selection (multi-asset picker)
    selectedDenom,
    setSelectedDenom,
    selectedSymbol: symbolForDenom(selectedDenom),
    // Bridgeable assets for the picker. Falls back to static metadata until the
    // live list resolves, so the picker always renders both CHANSE and ANSEM.
    assets:
      assets.length > 0
        ? assets.map((a) => ({ denom: a.denom, symbol: a.symbol }))
        : BRIDGE_ASSET_META.map((a) => ({ denom: a.denom, symbol: a.symbol })),

    // derived
    payBalance:
      direction === "sol_to_bwick"
        ? splBalance != null
          ? fromBaseUnits(splBalance)
          : "…"
        : bwickBalance != null
          ? fromBaseUnits(bwickBalance)
          : "…",
    receiveBalance:
      direction === "sol_to_bwick"
        ? bwickBalance != null
          ? fromBaseUnits(bwickBalance)
          : "…"
        : splBalance != null
          ? fromBaseUnits(splBalance)
          : "…",
    payChainLabel: direction === "sol_to_bwick" ? "Solana" : "bwickchain",
    receiveChainLabel:
      direction === "sol_to_bwick" ? "bwickchain" : "Solana",

    // amount validation — single source of truth for the submit button +
    // input hint. Empty input is "no error, just no action yet". Any other
    // unparseable / zero / over-balance / over-cap state produces a message.
    ...(() => {
      const trimmed = amount.trim();
      const payBalRaw =
        direction === "sol_to_bwick" ? splBalance : bwickBalance;
      const cap =
        direction === "sol_to_bwick" ? limits.maxMintPerTx : limits.maxBurnPerTx;
      if (trimmed.length === 0) {
        return {
          amountError: null as string | null,
          isAmountValid: false,
        };
      }
      let parsed: bigint;
      try {
        parsed = toBaseUnits(trimmed);
      } catch {
        return { amountError: "Enter a valid amount.", isAmountValid: false };
      }
      if (parsed <= BigInt(0)) {
        return { amountError: "Enter an amount.", isAmountValid: false };
      }
      if (payBalRaw != null && parsed > payBalRaw) {
        return {
          amountError: "Insufficient balance.",
          isAmountValid: false,
        };
      }
      if (cap != null && parsed > cap) {
        return {
          amountError: `Above per-tx limit (${fromBaseUnits(cap)} ${symbolForDenom(selectedDenom)}).`,
          isAmountValid: false,
        };
      }
      return { amountError: null, isAmountValid: true };
    })(),

    // Raw per-tx cap for the current direction, for UI hints.
    perTxLimit:
      (direction === "sol_to_bwick" ? limits.maxMintPerTx : limits.maxBurnPerTx)
        ?? null,
    perTxLimitDisplay: (() => {
      const cap =
        direction === "sol_to_bwick" ? limits.maxMintPerTx : limits.maxBurnPerTx;
      return cap != null ? fromBaseUnits(cap) : null;
    })(),

    // Setter for the Max button — fills the input with the raw pay balance.
    setMaxAmount: () => {
      const raw = direction === "sol_to_bwick" ? splBalance : bwickBalance;
      if (raw == null || raw <= BigInt(0)) return;
      setAmount(fromBaseUnits(raw));
    },
  };
}
