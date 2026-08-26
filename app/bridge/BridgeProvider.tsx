"use client";

// Solana wallet-adapter providers for the bridge page. Wraps just the
// bridge route so the lander doesn't pull web3.js into its bundle.

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { SOLANA_RPC } from "@/app/lib/config";
// Default styles for the wallet-modal — we don't render its UI (we use
// our own), but the module's CSS import must run for `useWallet().connect`
// to function with standard wallets.
import "@solana/wallet-adapter-react-ui/styles.css";

export function BridgeProvider({ children }: { children: React.ReactNode }) {
  // Phantom + Solflare adapters. BWICK Wallet + Backpack discover via
  // the Standard Wallet protocol without explicit adapters.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );
  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
