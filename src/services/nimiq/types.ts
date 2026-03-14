export interface NimiqProvider {
  listAccounts(): Promise<string[]>;
  isConsensusEstablished(): Promise<boolean>;
  getBlockNumber(): Promise<number>;
  sign(message: string | { message: string; isHex?: boolean }): Promise<{
    publicKey: string;
    signature: string;
  }>;
  sendBasicTransaction(params: {
    recipient: string;
    value: number; // Luna (1 NIM = 100_000 Luna)
    fee?: number;
  }): Promise<string>; // tx hash
  sendBasicTransactionWithData(params: {
    recipient: string;
    value: number;
    fee?: number;
    data?: string;
  }): Promise<string>;
}

declare global {
  interface Window {
    nimiq?: NimiqProvider;
  }
}
