
interface Window {
  solana?: {
    isPhantom?: boolean;
    isConnected?: boolean;
    publicKey?: {
      toString(): string;
      toBase58(): string;
    };
    connect(): Promise<{ publicKey: { toString(): string; toBase58(): string } }>;
    disconnect(): Promise<void>;
    signAndSendTransaction(transaction: Transaction | VersionedTransaction): Promise<{ signature: string }>;
    signMessage?(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  };
}