// bwickchain (Cosmos SDK) client helpers — Keplr connection, REST polling,
// and the custom MsgBurnForBridgeOut codec.
//
// Source of truth for the proto layout:
//   /Users/achi/Desktop/bwick/bwick-chain/x/bridge/types/tx.pb.go
//   message bridge.v1.MsgBurnForBridgeOut {
//     string sender         = 1;
//     string amount         = 2;  // cosmos-sdk math.Int -> string on the wire
//     string solana_address = 3;
//   }

import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";
import type {
  EncodeObject,
  OfflineSigner,
  Registry,
} from "@cosmjs/proto-signing";
import {
  DirectSecp256k1HdWallet,
  Registry as ProtoRegistry,
} from "@cosmjs/proto-signing";
import { stringToPath } from "@cosmjs/crypto";
import {
  defaultRegistryTypes,
  type StdFee,
  type DeliverTxResponse,
} from "@cosmjs/stargate";

import {
  BWICK_DENOM,
  BWICK_REST,
  BWICK_RPC,
  CHAIN_ID,
  KEPLR_CHAIN_INFO,
} from "./config";

// ----------------------------------------------------------------------------
// Minimal proto3 wire encoder for MsgBurnForBridgeOut
// ----------------------------------------------------------------------------

const TEXT_ENCODER = new TextEncoder();

function writeVarint(buf: number[], value: number) {
  while (value > 0x7f) {
    buf.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  buf.push(value & 0x7f);
}

function writeStringField(buf: number[], fieldNumber: number, value: string) {
  if (!value) return; // proto3 default-value omission for strings
  // tag = (field_number << 3) | wire_type(2 = length-delimited)
  writeVarint(buf, (fieldNumber << 3) | 2);
  const bytes = TEXT_ENCODER.encode(value);
  writeVarint(buf, bytes.length);
  for (const b of bytes) buf.push(b);
}

export interface MsgBurnForBridgeOutValue {
  sender: string;
  amount: string; // base units, integer string
  solanaAddress: string;
  /** Native denom to burn; empty means the priority asset (CHANSE). */
  denom: string;
}

export const MsgBurnForBridgeOutTypeUrl = "/bridge.v1.MsgBurnForBridgeOut";

// Hand-rolled codec compatible with cosmjs Registry's GeneratedType interface.
export const MsgBurnForBridgeOutCodec = {
  typeUrl: MsgBurnForBridgeOutTypeUrl,
  encode(message: MsgBurnForBridgeOutValue): { finish(): Uint8Array } {
    // Field order matches on-chain MsgBurnForBridgeOut (x/bridge/types/tx.pb.go):
    //   field 1: sender         (bech32 burner address; also the tx signer)
    //   field 2: amount         (cosmossdk.io/math.Int, encoded as a string)
    //   field 3: solana_address (base58 destination Solana pubkey)
    //   field 4: denom          (native denom; empty = priority asset)
    const buf: number[] = [];
    writeStringField(buf, 1, message.sender);
    writeStringField(buf, 2, message.amount);
    writeStringField(buf, 3, message.solanaAddress);
    // Only emit denom when set, so priority-asset burns stay byte-identical to
    // the single-asset era (empty proto3 string field is simply omitted).
    if (message.denom) writeStringField(buf, 4, message.denom);
    const bytes = new Uint8Array(buf);
    return { finish: () => bytes };
  },
  decode(_input: Uint8Array): MsgBurnForBridgeOutValue {
    // Decode is not used client-side (we never receive these from the chain).
    throw new Error("MsgBurnForBridgeOut decode not implemented");
  },
  fromPartial(p: Partial<MsgBurnForBridgeOutValue>): MsgBurnForBridgeOutValue {
    return {
      sender: p.sender ?? "",
      amount: p.amount ?? "0",
      solanaAddress: p.solanaAddress ?? "",
      denom: p.denom ?? "",
    };
  },
};

export function makeBwickRegistry(): Registry {
  const registry = new ProtoRegistry(defaultRegistryTypes);
  // Cast: cosmjs's GeneratedType is structural; our codec satisfies the shape.
  registry.register(
    MsgBurnForBridgeOutTypeUrl,
    MsgBurnForBridgeOutCodec as never
  );
  return registry;
}

// ----------------------------------------------------------------------------
// Keplr connection
// ----------------------------------------------------------------------------

// Wallet detection / connection lives in ./wallet — supports both the
// BWICK Wallet extension (window.bwickWallet.cosmos) and Keplr fallback.
import { connectWallet, type ConnectedWallet } from "./wallet";

/**
 * @deprecated Use `connectWallet` from `./wallet` directly.
 * Retained as a thin alias for callers wired to the previous API.
 */
export async function connectKeplr(): Promise<{
  signer: OfflineSigner;
  address: string;
  name: string;
}> {
  const { signer, address, name } = await connectBwickchainWallet();
  return { signer, address, name };
}

/** Connect to bwickchain via whichever Cosmos wallet the user has. */
export async function connectBwickchainWallet(): Promise<ConnectedWallet> {
  return connectWallet({ chainInfo: KEPLR_CHAIN_INFO, chainId: CHAIN_ID });
}

export async function makeSigningClient(
  signer: OfflineSigner
): Promise<SigningStargateClient> {
  return SigningStargateClient.connectWithSigner(BWICK_RPC, signer, {
    registry: makeBwickRegistry(),
    gasPrice: GasPrice.fromString(`0.025${BWICK_DENOM}`),
  });
}

// ----------------------------------------------------------------------------
// In-browser HD wallet (fallback for Keplr UI bugs)
//
// The mnemonic stays in this function's scope and the caller's React state.
// Nothing is persisted: callers must wipe the input after use.
// ----------------------------------------------------------------------------

/** Default Cosmos Hub-style derivation path used by bwickchain (coin type 118). */
export const BWICK_DEFAULT_HD_PATH = "m/44'/118'/0'/0/0";

/**
 * Derive a `DirectSecp256k1HdWallet` from a BIP39 mnemonic, using bwickchain's
 * bech32 prefix and the supplied derivation path (defaulting to the standard
 * `m/44'/118'/0'/0/0`). Throws verbatim on bad mnemonic — the caller surfaces.
 */
export async function walletFromMnemonic(
  mnemonic: string,
  hdPath: string = BWICK_DEFAULT_HD_PATH
): Promise<{ signer: OfflineSigner; address: string }> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "bwick",
    hdPaths: [stringToPath(hdPath)],
  });
  const [account] = await wallet.getAccounts();
  if (!account) throw new Error("Failed to derive account from mnemonic.");
  return { signer: wallet, address: account.address };
}

export async function broadcastBurnForBridgeOut(args: {
  client: SigningStargateClient;
  sender: string;
  amount: bigint;
  solanaAddress: string;
  /** Native denom to burn; empty/omitted burns the priority asset (CHANSE). */
  denom?: string;
}): Promise<DeliverTxResponse> {
  const { client, sender, amount, solanaAddress, denom = "" } = args;
  const msg: EncodeObject = {
    typeUrl: MsgBurnForBridgeOutTypeUrl,
    value: {
      sender,
      amount: amount.toString(),
      solanaAddress,
      denom,
    } satisfies MsgBurnForBridgeOutValue,
  };
  // Gas fee is ALWAYS paid in the gas denom (CHANSE), independent of which
  // asset is being bridged out.
  // Chain min fee = gas (250k) × gasPrice (0.025 ubwick/gas) = 6250 ubwick.
  // Pay 7500 for a small margin so a slightly-higher network minimum
  // doesn't bounce the tx.
  const fee: StdFee = {
    amount: [{ denom: BWICK_DENOM, amount: "7500" }],
    gas: "250000",
  };
  return client.signAndBroadcast(sender, [msg], fee, "bwick-bridge withdraw");
}

// ----------------------------------------------------------------------------
// REST polling helpers (used to confirm relayer mints landed on bwickchain)
// ----------------------------------------------------------------------------

/** Query the bank balance of a chain address for one denom (default gas denom). */
export async function fetchBwickBalance(
  address: string,
  denom: string = BWICK_DENOM,
): Promise<bigint> {
  const url = `${BWICK_REST}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${denom}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Balance query failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { balance?: { amount?: string } };
  return BigInt(json.balance?.amount ?? "0");
}

/**
 * Search bwickchain transactions for a relayer mint targeting `recipient`.
 * Returns the first matching tx hash, or null if not yet present.
 *
 * The bridge module emits event type `bridge_mint` with attribute `recipient`
 * (verified against `x/bridge/keeper/msg_mint_from_bridge.go`). The chain's
 * REST gateway uses the cosmos-sdk 0.50+ `query=` syntax with AND-conjoined
 * clauses (the legacy `events=` parameter is rejected).
 */
export async function findMintForRecipient(
  recipient: string,
  sinceHeight?: number
): Promise<{ txHash: string; height: number } | null> {
  const clauses = [`bridge_mint.recipient='${recipient}'`];
  if (sinceHeight) clauses.push(`tx.height>=${sinceHeight}`);
  const query = clauses.join(" AND ");
  const url = new URL(`${BWICK_REST}/cosmos/tx/v1beta1/txs`);
  url.searchParams.set("query", query);
  url.searchParams.set("order_by", "ORDER_BY_DESC");
  url.searchParams.set("pagination.limit", "5");
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    tx_responses?: Array<{ txhash: string; height: string }>;
  };
  const hit = json.tx_responses?.[0];
  if (!hit) return null;
  return { txHash: hit.txhash, height: Number(hit.height) };
}

/** Get the current bwickchain head height. */
export async function fetchLatestHeight(): Promise<number> {
  const url = `${BWICK_REST}/cosmos/base/tendermint/v1beta1/blocks/latest`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Height query failed: HTTP ${res.status}`);
  const json = (await res.json()) as { block?: { header?: { height?: string } } };
  return Number(json.block?.header?.height ?? 0);
}
