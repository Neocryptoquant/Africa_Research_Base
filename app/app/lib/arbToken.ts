import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';

// $ARB Token Details
export const ARB_TOKEN_MINT = new PublicKey('BUd49N8cqwj4q7NHPSKWJM4iqgjs3pck98rZKhYgpb4x');
export const ARB_DECIMALS = 6; // Standard SPL token decimals

// Treasury wallet that holds $ARB tokens for distribution
// You'll need to fund this wallet with $ARB tokens
const TREASURY_PRIVATE_KEY = process.env.ARB_TREASURY_PRIVATE_KEY || '';

export class ARBTokenService {
  private connection: Connection;
  private treasuryKeypair: Keypair | null = null;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Initialize treasury wallet if private key is available
    if (TREASURY_PRIVATE_KEY) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(TREASURY_PRIVATE_KEY));
        this.treasuryKeypair = Keypair.fromSecretKey(secretKey);
        console.log('Treasury wallet initialized:', this.treasuryKeypair.publicKey.toBase58());
      } catch (error) {
        console.error('Failed to initialize treasury wallet:', error);
      }
    }
  }

  /**
   * Convert token amount to smallest units (considering decimals)
   */
  toTokenAmount(amount: number): number {
    return Math.floor(amount * Math.pow(10, ARB_DECIMALS));
  }

  /**
   * Convert smallest units back to readable amount
   */
  fromTokenAmount(amount: number): number {
    return amount / Math.pow(10, ARB_DECIMALS);
  }

  /**
   * Get or create Associated Token Account for a user
   */
  async getOrCreateTokenAccount(userPublicKey: PublicKey): Promise<PublicKey> {
    try {
      const associatedTokenAddress = await getAssociatedTokenAddress(
        ARB_TOKEN_MINT,
        userPublicKey
      );

      // Check if account exists
      try {
        await getAccount(this.connection, associatedTokenAddress);
        console.log('Token account exists:', associatedTokenAddress.toBase58());
        return associatedTokenAddress;
      } catch (error) {
        // Account doesn't exist, we'll need to create it
        console.log('Token account needs to be created');
        return associatedTokenAddress;
      }
    } catch (error) {
      console.error('Error getting token account:', error);
      throw error;
    }
  }

  /**
   * Transfer $ARB tokens from treasury to user
   */
  async transferTokens(
    recipientPublicKey: PublicKey,
    amount: number,
    reason: string
  ): Promise<string> {
    if (!this.treasuryKeypair) {
      throw new Error('Treasury wallet not initialized. Please set ARB_TREASURY_PRIVATE_KEY');
    }

    try {
      console.log(`Transferring ${amount} $ARB to ${recipientPublicKey.toBase58()} for: ${reason}`);

      // Get token accounts
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        ARB_TOKEN_MINT,
        this.treasuryKeypair.publicKey
      );

      const recipientTokenAccount = await getAssociatedTokenAddress(
        ARB_TOKEN_MINT,
        recipientPublicKey
      );

      // Create transaction
      const transaction = new Transaction();

      // Check if recipient token account exists, if not create it
      try {
        await getAccount(this.connection, recipientTokenAccount);
      } catch {
        // Create associated token account for recipient
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.treasuryKeypair.publicKey, // payer
            recipientTokenAccount,
            recipientPublicKey,
            ARB_TOKEN_MINT
          )
        );
      }

      // Add transfer instruction
      const tokenAmount = this.toTokenAmount(amount);
      transaction.add(
        createTransferInstruction(
          treasuryTokenAccount,
          recipientTokenAccount,
          this.treasuryKeypair.publicKey,
          tokenAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.treasuryKeypair.publicKey;

      // Sign and send transaction
      transaction.sign(this.treasuryKeypair);
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Token transfer successful:', signature);
      return signature;

    } catch (error) {
      console.error('Token transfer failed:', error);
      throw error;
    }
  }

  /**
   * Get user's $ARB token balance
   */
  async getTokenBalance(userPublicKey: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        ARB_TOKEN_MINT,
        userPublicKey
      );

      const accountInfo = await getAccount(this.connection, tokenAccount);
      return this.fromTokenAmount(Number(accountInfo.amount));
    } catch (error) {
      console.log('No token account found or error:', error);
      return 0;
    }
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<number> {
    if (!this.treasuryKeypair) {
      return 0;
    }

    try {
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        ARB_TOKEN_MINT,
        this.treasuryKeypair.publicKey
      );

      const accountInfo = await getAccount(this.connection, treasuryTokenAccount);
      return this.fromTokenAmount(Number(accountInfo.amount));
    } catch (error) {
      console.error('Error getting treasury balance:', error);
      return 0;
    }
  }

  /**
   * Batch transfer to multiple recipients (for airdrops)
   */
  async batchTransfer(
    recipients: Array<{ publicKey: PublicKey; amount: number; reason: string }>
  ): Promise<string[]> {
    const signatures: string[] = [];

    for (const recipient of recipients) {
      try {
        const signature = await this.transferTokens(
          recipient.publicKey,
          recipient.amount,
          recipient.reason
        );
        signatures.push(signature);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to transfer to ${recipient.publicKey.toBase58()}:`, error);
      }
    }

    return signatures;
  }
}

// Reward amounts (in $ARB tokens)
export const REWARD_AMOUNTS = {
  SIGNUP_BONUS: 100,           // 100 $ARB for signing up
  DATASET_UPLOAD: 50,          // 50 $ARB per upload
  DATASET_VERIFIED: 200,       // 200 $ARB when dataset gets verified
  REVIEW_SUBMITTED: 20,        // 20 $ARB per review
  HIGH_QUALITY_BONUS: 100,     // 100 $ARB for 90+ quality score
  MILESTONE_1000: 500,         // 500 $ARB at 1000 total tokens
  REFERRAL_BONUS: 50          // 50 $ARB per referral
};

// Export singleton instance
export const arbTokenService = new ARBTokenService(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
);