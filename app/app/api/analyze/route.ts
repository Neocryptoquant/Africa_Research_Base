import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { read, utils } from 'xlsx';
import CryptoJS from 'crypto-js';
import { Groq } from 'groq-sdk';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import fs from 'fs';
import idlJson from '../../../idl.json';
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";
import QRCode from 'qrcode';
import bs58 from 'bs58';

// Validate env
if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
if (!process.env.PROGRAM_ID) throw new Error('PROGRAM_ID not set');
if (!process.env.ANCHOR_WALLET) console.warn('ANCHOR_WALLET not set, using generated keypair');

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);

let keypair: Keypair;
if (process.env.ANCHOR_WALLET) {
  try {
    let secretKeyArray: number[];
    if (process.env.ANCHOR_WALLET.trim().startsWith('/')) {
      secretKeyArray = JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, 'utf8'));
    } else {
      secretKeyArray = JSON.parse(process.env.ANCHOR_WALLET);
    }
    if (!Array.isArray(secretKeyArray) || secretKeyArray.length !== 64) throw new Error('Invalid secret key');
    keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    console.log('Loaded wallet from environment variable');
  } catch (error) {
    console.error('Failed to load wallet:', error);
    keypair = Keypair.generate();
    console.log('Generated new dev keypair. Secret key:', Array.from(keypair.secretKey));
  }
} else {
  keypair = Keypair.generate();
  console.log('Generated new dev keypair. Secret key:', Array.from(keypair.secretKey));
}

const wallet = {
  publicKey: keypair.publicKey,
  signTransaction: async (tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> => {
    try {
      console.log('Transaction type:', tx.constructor.name);

      if (tx instanceof VersionedTransaction) {
        tx.sign([keypair]);
        return tx; // VersionedTransaction.sign() returns void, but we return the tx
      } else if (tx instanceof Transaction) {
        tx.sign(keypair);
        return tx;
      }
      throw new Error('Unsupported transaction type');
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  },
  signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]> => {
    try {
      const signedTxs = [];
      for (const tx of txs) {
        const signedTx = await wallet.signTransaction(tx);
        signedTxs.push(signedTx);
      }
      return signedTxs;
    } catch (error) {
      console.error('Error signing all transactions:', error);
      throw error;
    }
  }
};

const provider = new AnchorProvider(connection, wallet as any, { 
  commitment: 'confirmed',
  preflightCommitment: 'confirmed'
});
const programId = new PublicKey(process.env.PROGRAM_ID!);
const program = new Program(idlJson as any, provider);

// Irys uploader setup - use keypair secret key as private key
const getIrysUploader = async () => {
  // Convert keypair secret key to base58 string for Irys
  const privateKeyBase58 = bs58.encode(keypair.secretKey);
  const irysUploader = await Uploader(Solana)
    .withWallet(privateKeyBase58);
  return irysUploader;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(fileType || '')) return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    if (buffer.length > 100 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 400 });

    let parsedData: any[] = [];
    let headers: string[] = [];
    if (fileType === 'csv') {
      const result = Papa.parse(buffer.toString(), { header: true, dynamicTyping: true, skipEmptyLines: true });
      parsedData = result.data.slice(0, 100);
      headers = result.meta.fields || [];
    } else {
      const workbook = read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      headers = json[0] || [];
      parsedData = json.slice(1, 101).map(row => 
        headers.reduce((obj, h, i) => ({ ...obj, [h]: row[i] || null }), {})
      );
    }

    const rowCount = parsedData.length;
    const colCount = headers.length;
    if (colCount > 100) return NextResponse.json({ error: 'Too many columns' }, { status: 400 });

    const missingPct = headers.reduce((acc, h) => {
      const colMissing = parsedData.filter(row => !row[h]).length / rowCount;
      return acc + colMissing;
    }, 0) / colCount * 100;

    // Hash (32 bytes)
    const hashHex = CryptoJS.SHA256(buffer.toString()).toString(CryptoJS.enc.Hex);
    const hashBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hashBytes[i] = parseInt(hashHex.substr(i * 2, 2), 16);
    }

    // AI Analysis: Concise with description and tags
    const sampleRows = JSON.stringify(parsedData.slice(0, 5));
    const completion = await groqClient.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Headers: ${headers.join(', ')}. Sample rows: ${sampleRows}. Row count: ${rowCount}. Missing %: ${missingPct.toFixed(2)}.
        Output concise JSON only: {"description": "brief summary (1 sentence)", "columns": [{"name": "col", "type": "numeric|categorical|date|text"}], "quality_score": number (0-100), "field": "environment|health|economics|social_sciences|other", "tags": ["array of 3-5 concise tags"]}. Classify for African research (e.g., climate for weather). No Markdown.`
      }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });
    let aiText = completion.choices[0]?.message?.content || '{}';
    aiText = aiText.replace(/```json\n|\n```/g, '').trim();
    let aiResult;
    try {
      aiResult = JSON.parse(aiText);
    } catch (parseError) {
      console.error('AI response parsing failed. Raw response:', aiText, parseError);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }
    const { description = 'No description generated', columns = [], quality_score: qualityScore = 0, field = 'other', tags = [] } = aiResult;
    
    // Create compact metadata to avoid transaction size limits
    const compactMetadata = {
      cols: columns.slice(0, 10).map((c: { name: string; type: string }) => ({ n: c.name.slice(0, 20), t: c.type[0] })), // Truncate to 10 cols, 20 chars each
      score: qualityScore,
      field: field.slice(0, 10),
      tags: tags.slice(0, 3).map((t: string) => t.slice(0, 15)) // Max 3 tags, 15 chars each
    };
    const metadata = Buffer.from(JSON.stringify(compactMetadata));

    // PDAs
    const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from('registry'), keypair.publicKey.toBuffer()], programId);
    const [reputationPda] = PublicKey.findProgramAddressSync([Buffer.from('reputation'), keypair.publicKey.toBuffer()], programId);

    // Initialize accounts if they don't exist
    let datasetCount = 0;
    
    // Check if registry exists, initialize if not
    try {
      await (program.account as any).registry.fetch(registryPda);
      console.log('Registry account exists');
    } catch (error) {
      console.log('Registry account does not exist, initializing...');
      try {
        await program.methods.initializeRegistry()
          .accounts({
            admin: keypair.publicKey,
            registry: registryPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log('Registry initialized successfully');
      } catch (initError) {
        console.error('Failed to initialize registry:', initError);
        const errorMessage = (initError as Error).message;
        if (!errorMessage.includes('already in use')) {
          return NextResponse.json({ error: 'Failed to initialize registry: ' + errorMessage }, { status: 500 });
        }
        console.log('Registry account already exists (initialization skipped)');
      }
    }

    // Check if reputation exists, initialize if not and get dataset count
    try {
      const reputationAccount = await (program.account as any).reputation.fetch(reputationPda);
      datasetCount = reputationAccount.datasetCount.toNumber();
      console.log('Current dataset count:', datasetCount);
    } catch (fetchError) {
      console.log('Reputation account fetch failed, attempting initialization...');
      try {
        await program.methods.initializeReputation()
          .accounts({
            user: keypair.publicKey,
            reputation: reputationPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log('Reputation initialized successfully');
        datasetCount = 0; // New reputation account starts at 0
      } catch (initError) {
        console.error('Failed to initialize reputation:', initError);
        const errorMessage = (initError as Error).message;
        if (errorMessage.includes('already in use')) {
          console.log('Reputation account conflict detected, trying alternative approach...');
          // Instead of retrying fetch, let's increment from last known state
          // Check if we can get datasetCount from a different method or use a reasonable default
          datasetCount = 1; // Use 1 instead of 0 to avoid PDA conflicts
          console.log('Using datasetCount:', datasetCount);
        } else {
          return NextResponse.json({ error: 'Failed to initialize reputation: ' + errorMessage }, { status: 500 });
        }
      }
    }

    // Create dataset PDA with counter-based seeds (match Rust's to_le_bytes format)
    const counterBytes = Buffer.alloc(4);
    counterBytes.writeUInt32LE(datasetCount, 0);
    const [datasetPda] = PublicKey.findProgramAddressSync([
      Buffer.from('dataset'),
      keypair.publicKey.toBuffer(),
      counterBytes
    ], programId);

    // Irys upload
    try {
      const irysUploader = await getIrysUploader();
      const receipt = await irysUploader.upload(buffer, {
        tags: [{ name: "Content-Type", value: fileType === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }]
      });
      const irysLink = `https://gateway.irys.xyz/${receipt.id}`; // Gatekept link

      // Solana Pay with contributor's wallet and fee
      const payWalletAddress = formData.get('payWalletAddress')?.toString() || keypair.publicKey.toString();
      const feeAmountStr = formData.get('feeAmount')?.toString() || 'tip';
      const payWallet = new PublicKey(payWalletAddress);
      const feeAmount = feeAmountStr === 'tip' ? new BN(0) : new BN(Number(feeAmountStr) * 1e9);
      const qrCode = await QRCode.toDataURL(`solana:${payWallet.toBase58()}?amount=${feeAmountStr === 'tip' ? '0' : feeAmountStr}&label=Dataset%20Download&message=Pay%20for%20${file.name}`);

      console.log('Calling createDataset with parameters:');
      console.log('- hashBytes length:', hashBytes.length);
      console.log('- metadata length:', metadata.length);
      console.log('- qualityScore:', Math.min(255, Math.max(0, qualityScore)));

      const txSig = await program.methods.createDataset(
        hashBytes,
        metadata,
        Buffer.from(file.name.slice(0, 100)),
        new BN(buffer.length),
        new Uint8Array(256).fill(0),
        new BN(colCount),
        new BN(rowCount),
        Math.min(255, Math.max(0, Math.floor(qualityScore)))
      ).accounts({
        admin: keypair.publicKey,
        user: keypair.publicKey,
        contributor: keypair.publicKey,
        registry: registryPda,
        dataset: datasetPda,
        reputation: reputationPda,
        systemProgram: SystemProgram.programId,
      }).rpc();

      // Return with metadata, link, and payment details
      return NextResponse.json({
        tx: txSig,
        basics: { rowCount, colCount, missingPct: missingPct.toFixed(2) },
        ai: { description, qualityScore, field, tags, columns },
        uploaderLink: irysLink, // Private for uploader
        payForDownload: { qrCode, wallet: payWalletAddress, fee: feeAmountStr } // For others
      }, { status: 200 });

    } catch (irysError) {
      console.error('Irys upload failed:', irysError);
      // Continue without Irys upload, just do the blockchain transaction
      const payWalletAddress = formData.get('payWalletAddress')?.toString() || keypair.publicKey.toString();
      const feeAmountStr = formData.get('feeAmount')?.toString() || 'tip';
      const payWallet = new PublicKey(payWalletAddress);
      const qrCode = await QRCode.toDataURL(`solana:${payWallet.toBase58()}?amount=${feeAmountStr === 'tip' ? '0' : feeAmountStr}&label=Dataset%20Download&message=Pay%20for%20${file.name}`);

      const txSig = await program.methods.createDataset(
        hashBytes,
        metadata,
        Buffer.from(file.name.slice(0, 100)),
        new BN(buffer.length),
        new Uint8Array(256).fill(0),
        new BN(colCount),
        new BN(rowCount),
        Math.min(255, Math.max(0, Math.floor(qualityScore)))
      ).accounts({
        admin: keypair.publicKey,
        user: keypair.publicKey,
        contributor: keypair.publicKey,
        registry: registryPda,
        dataset: datasetPda,
        reputation: reputationPda,
        systemProgram: SystemProgram.programId,
      }).rpc();

      return NextResponse.json({
        tx: txSig,
        basics: { rowCount, colCount, missingPct: missingPct.toFixed(2) },
        ai: { description, qualityScore, field, tags, columns },
        uploaderLink: null, // Irys failed
        irysError: 'Irys upload failed: ' + (irysError as Error).message,
        payForDownload: { qrCode, wallet: payWalletAddress, fee: feeAmountStr }
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error: ' + (error as Error).message }, { status: 500 });
  }
}