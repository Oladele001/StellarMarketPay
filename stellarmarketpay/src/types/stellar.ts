export interface StellarAccount {
  publicKey: string;
  secretKey?: string;
  balance: string;
  sequence: number;
}

export interface PaymentRequest {
  id: string;
  amount: string;
  asset: string;
  destination: string;
  memo?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'expense';
  amount: string;
  description: string;
  category?: string;
  stellarTransactionId?: string;
  createdAt: Date;
}

export interface QRPaymentData {
  destination: string;
  amount: string;
  asset: string;
  memo?: string;
}
