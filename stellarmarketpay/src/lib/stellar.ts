import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarAccount, PaymentRequest, QRPaymentData } from '@/types/stellar';

// Configure Stellar for testnet (change to mainnet for production)
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
StellarSdk.Networks.TESTNET;

export class StellarService {
  // Create a new Stellar account
  static createAccount(): StellarAccount {
    const pair = StellarSdk.Keypair.random();
    return {
      publicKey: pair.publicKey(),
      secretKey: pair.secret(),
      balance: '0',
      sequence: 0
    };
  }

  // Load account details from Horizon
  static async loadAccount(publicKey: string): Promise<StellarAccount> {
    try {
      const account = await server.loadAccount(publicKey);
      const balance = account.balances.find((b: any) => b.asset_type === 'native');
      
      return {
        publicKey: account.accountId(),
        balance: balance ? balance.balance : '0',
        sequence: parseInt(account.sequence.toString())
      };
    } catch (error) {
      throw new Error('Account not found or network error');
    }
  }

  // Create a payment transaction
  static async createPayment(
    sourceSecret: string,
    destination: string,
    amount: string,
    memo?: string
  ): Promise<string> {
    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
      const sourcePublicKey = sourceKeypair.publicKey();
      
      const account = await server.loadAccount(sourcePublicKey);
      const fee = await server.fetchBaseFee();
      
      let transaction = new StellarSdk.TransactionBuilder(account, { fee: fee.toString() })
        .addOperation(StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount
        }))
        .setTimeout(30);

      if (memo) {
        transaction = transaction.addMemo(StellarSdk.Memo.text(memo));
      }

      const builtTransaction = transaction.build();
      builtTransaction.sign(sourceKeypair);
      
      const result = await server.submitTransaction(builtTransaction);
      return result.hash;
    } catch (error) {
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Generate QR code data for payment request
  static generateQRPaymentData(data: QRPaymentData): string {
    const paymentData = {
      stellar: data.destination,
      amount: data.amount,
      asset: data.asset,
      memo: data.memo
    };
    return JSON.stringify(paymentData);
  }

  // Parse QR payment data
  static parseQRPaymentData(qrData: string): QRPaymentData {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.stellar) {
        return {
          destination: parsed.stellar,
          amount: parsed.amount || '0',
          asset: parsed.asset || 'XLM',
          memo: parsed.memo
        };
      }
      throw new Error('Invalid QR payment data');
    } catch (error) {
      throw new Error('Failed to parse QR payment data');
    }
  }

  // Stream payments for an account
  static streamPayments(
    publicKey: string,
    onPayment: (payment: any) => void
  ): () => void {
    const es = server.payments()
      .forAccount(publicKey)
      .cursor('now')
      .stream({
        onmessage: onPayment
      });
    
    return () => {
      // Stream cleanup - the stream will be garbage collected
      console.log('Stream cleanup called');
    };
  }

  // Get transaction history
  static async getTransactionHistory(publicKey: string): Promise<any[]> {
    try {
      const transactions = await server.transactions()
        .forAccount(publicKey)
        .limit(10)
        .call();
      
      return transactions.records;
    } catch (error) {
      throw new Error('Failed to fetch transaction history');
    }
  }
}
