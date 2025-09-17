import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { expect } from 'chai';
import { sha256 } from 'js-sha256';
import { AfricaResearchBase } from '../target/types/africa_research_base';

describe("Africa Research Base (ARB)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AfricaResearchBase as Program<AfricaResearchBase>;
  
  let datasetRegistry: PublicKey;
  const admin = provider.wallet.publicKey;
  
  const researcher1 = Keypair.generate();
  const researcher2 = Keypair.generate();
  const researcher3 = Keypair.generate();
  
  const TEST_FILE_NAME = "climate_survey_uganda_2024.csv";
  const TEST_FILE_SIZE = 1024 * 1024; // 1MB
  const TEST_COLUMN_COUNT = 25;
  const TEST_ROW_COUNT = 1500;
  const TEST_QUALITY_SCORE = 85;
  const TEST_AI_METADATA = Buffer.from(JSON.stringify({
    fields: ["temperature", "rainfall", "location", "date"],
    dataTypes: ["numeric", "numeric", "categorical", "date"],
    qualityMetrics: {
      completeness: 0.95,
      consistency: 0.88,
      accuracy: 0.92
    },
    suggestedTags: ["climate", "uganda", "survey", "environmental"]
  }));

  const generateContentHash = (data: string): number[] => {
    const hash = sha256(data);
    return Array.from(Buffer.from(hash, 'hex')).slice(0, 32);
  };

  const createDataUri = (uri: string): number[] => {
    const buffer = Buffer.from(uri, 'utf-8');
    const paddedBuffer = Buffer.alloc(256);
    buffer.copy(paddedBuffer);
    return Array.from(paddedBuffer);
  };

  before(async () => {
    const airdropPromises = [researcher1, researcher2, researcher3].map(async (keypair) => {
      const signature = await provider.connection.requestAirdrop(
        keypair.publicKey, 
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    });
    
    await Promise.all(airdropPromises);

    [datasetRegistry] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry"), admin.toBuffer()],
      program.programId
    );

    // Initialize registry (assuming initialize_registry is called once)
    const [dummyDataset] = PublicKey.findProgramAddressSync(
      [Buffer.from("dataset"), admin.toBuffer()],
      program.programId
    );
    const [dummyCitation] = PublicKey.findProgramAddressSync(
      [Buffer.from("citation"), admin.toBuffer()],
      program.programId
    );
    const [dummyReputation] = PublicKey.findProgramAddressSync(
      [Buffer.from("reputation"), admin.toBuffer()],
      program.programId
    );
    const [dummyAttribution] = PublicKey.findProgramAddressSync(
      [Buffer.from("attribution"), admin.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeRegistry()
      .accounts({
        admin: admin,
        user: admin,
        contributor: admin,
        registry: datasetRegistry,
        dataset: dummyDataset,
        citation: dummyCitation,
        reputation: dummyReputation,
        attribution: dummyAttribution,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  describe("Registry Initialization", () => {
    it("Should initialize the dataset registry successfully", async () => {
      const registryAccount = await program.account.registry.fetch(datasetRegistry);
      expect(registryAccount.admin.toString()).to.equal(admin.toString());
      expect(registryAccount.totalDatasets.toNumber()).to.equal(0);
    });

    it("Should fail to initialize registry twice", async () => {
      const [dummyDataset] = PublicKey.findProgramAddressSync(
        [Buffer.from("dataset"), admin.toBuffer()],
        program.programId
      );
      const [dummyCitation] = PublicKey.findProgramAddressSync(
        [Buffer.from("citation"), admin.toBuffer()],
        program.programId
      );
      const [dummyReputation] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), admin.toBuffer()],
        program.programId
      );
      const [dummyAttribution] = PublicKey.findProgramAddressSync(
        [Buffer.from("attribution"), admin.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .initializeRegistry()
          .accounts({
            admin: admin,
            user: admin,
            contributor: admin,
            registry: datasetRegistry,
            dataset: dummyDataset,
            citation: dummyCitation,
            reputation: dummyReputation,
            attribution: dummyAttribution,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("Dataset Creation", () => {
    describe("Successful Dataset Creation", () => {
      it("Should create a dataset with valid parameters", async () => {
        const contentHash = generateContentHash("test_dataset_content_1");
        const dataUri = createDataUri("https://drive.google.com/file/d/1234567890/view");
        const fileNameBuffer = Buffer.from(TEST_FILE_NAME, 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher1.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher1.publicKey.toBuffer()],
          program.programId
        );

        // Pre-init reputation (add init_if_needed in Rust or call init_reputation)
        await program.methods
          .initializeReputation()
          .accounts({
            admin: admin,
            user: researcher1.publicKey,
            contributor: researcher1.publicKey,
            registry: datasetRegistry,
            dataset: datasetPda,
            citation: PublicKey.findProgramAddressSync(
              [Buffer.from("citation"), researcher1.publicKey.toBuffer()],
              program.programId
            )[0],
            reputation: repPda,
            attribution: PublicKey.findProgramAddressSync(
              [Buffer.from("attribution"), researcher1.publicKey.toBuffer()],
              program.programId
            )[0],
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher1])
          .rpc();

        await program.methods
          .createDataset(
            contentHash,
            TEST_AI_METADATA,
            fileNameBuffer,
            new anchor.BN(TEST_FILE_SIZE),
            dataUri,
            new anchor.BN(TEST_COLUMN_COUNT),
            new anchor.BN(TEST_ROW_COUNT),
            TEST_QUALITY_SCORE
          )
          .accounts({
            admin: admin,
            user: researcher3.publicKey,
            contributor: researcher3.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher3])
          .rpc();

        const initialRep = await program.account.reputation.fetch(repPda);
        const initialScore = initialRep.reputationScore.toNumber();

        await program.methods
          .updateReputationCitation()
          .accounts({
            admin: admin,
            contributor: researcher3.publicKey,
            reputation: repPda,
            dataset: datasetPda,
            systemProgram: SystemProgram.programId,
          });
      });
    });
  });
});_AI_METADATA,
            fileNameBuffer,
            new anchor.BN(TEST_FILE_SIZE),
            dataUri,
            new anchor.BN(TEST_COLUMN_COUNT),
            new anchor.BN(TEST_ROW_COUNT),
            TEST_QUALITY_SCORE
          )
          .accounts({
            admin: admin,
            user: researcher1.publicKey,
            contributor: researcher1.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher1])
          .rpc();

        const datasetAccount = await program.account.dataset.fetch(datasetPda);
        expect(datasetAccount.contentHash).to.deep.equal(contentHash);
        expect(datasetAccount.contributor.toString()).to.equal(researcher1.publicKey.toString());
        expect(datasetAccount.fileSize.toNumber()).to.equal(TEST_FILE_SIZE);
        expect(datasetAccount.columnCount.toNumber()).to.equal(TEST_COLUMN_COUNT);
        expect(datasetAccount.rowCount.toNumber()).to.equal(TEST_ROW_COUNT);
        expect(datasetAccount.qualityScore).to.equal(TEST_QUALITY_SCORE);
        expect(datasetAccount.downloadCount).to.equal(0);
        expect(datasetAccount.isActive).to.equal(true);

        const registryAccount = await program.account.registry.fetch(datasetRegistry);
        expect(registryAccount.totalDatasets.toNumber()).to.equal(1);

        const reputationAccount = await program.account.reputation.fetch(repPda);
        expect(reputationAccount.totalUploads.toNumber()).to.equal(1);
        expect(reputationAccount.totalQualityScore.toNumber()).to.equal(TEST_QUALITY_SCORE);
      });

      it("Should create dataset with minimum file size (1 byte)", async () => {
        const contentHash = generateContentHash("tiny_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/tiny/view");
        const fileNameBuffer = Buffer.from("tiny.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher2.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher2.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .initializeReputation()
          .accounts({
            admin: admin,
            user: researcher2.publicKey,
            contributor: researcher2.publicKey,
            registry: datasetRegistry,
            dataset: datasetPda,
            citation: PublicKey.findProgramAddressSync(
              [Buffer.from("citation"), researcher2.publicKey.toBuffer()],
              program.programId
            )[0],
            reputation: repPda,
            attribution: PublicKey.findProgramAddressSync(
              [Buffer.from("attribution"), researcher2.publicKey.toBuffer()],
              program.programId
            )[0],
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher2])
          .rpc();

        await program.methods
          .createDataset(
            contentHash,
            Buffer.from('{"minimal": true}', 'utf-8'),
            fileNameBuffer,
            new anchor.BN(1),
            dataUri,
            new anchor.BN(1),
            new anchor.BN(1),
            50
          )
          .accounts({
            admin: admin,
            user: researcher2.publicKey,
            contributor: researcher2.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher2])
          .rpc();

        const datasetAccount = await program.account.dataset.fetch(datasetPda);
        expect(datasetAccount.fileSize.toNumber()).to.equal(1);
      });

      it("Should create dataset with maximum allowed file size (99MB)", async () => {
        const contentHash = generateContentHash("large_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/large/view");
        const fileNameBuffer = Buffer.from("large_dataset.csv", 'utf-8');
        const maxSize = 99 * 1024 * 1024; // 99MB

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher3.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher3.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .initializeReputation()
          .accounts({
            admin: admin,
            user: researcher3.publicKey,
            contributor: researcher3.publicKey,
            registry: datasetRegistry,
            dataset: datasetPda,
            citation: PublicKey.findProgramAddressSync(
              [Buffer.from("citation"), researcher3.publicKey.toBuffer()],
              program.programId
            )[0],
            reputation: repPda,
            attribution: PublicKey.findProgramAddressSync(
              [Buffer.from("attribution"), researcher3.publicKey.toBuffer()],
              program.programId
            )[0],
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher3])
          .rpc();

        await program.methods
          .createDataset(
            contentHash,
            TEST_AI_METADATA,
            fileNameBuffer,
            new anchor.BN(maxSize),
            dataUri,
            new anchor.BN(100),
            new anchor.BN(10000),
            100
          )
          .accounts({
            admin: admin,
            user: researcher3.publicKey,
            contributor: researcher3.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher3])
          .rpc();

        const datasetAccount = await program.account.dataset.fetch(datasetPda);
        expect(datasetAccount.fileSize.toNumber()).to.equal(maxSize);
        expect(datasetAccount.qualityScore).to.equal(100);
      });
    });

    describe("Dataset Creation Edge Cases", () => {
      it("Should fail with file size exceeding 100MB limit", async () => {
        const contentHash = generateContentHash("oversized_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/oversized/view");
        const fileNameBuffer = Buffer.from("oversized.csv", 'utf-8');
        const oversizedFile = 101 * 1024 * 1024; // 101MB

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher1.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher1.publicKey.toBuffer()],
          program.programId
        );

        try {
          await program.methods
            .createDataset(
              contentHash,
              TEST_AI_METADATA,
              fileNameBuffer,
              new anchor.BN(oversizedFile),
              dataUri,
              new anchor.BN(TEST_COLUMN_COUNT),
              new anchor.BN(TEST_ROW_COUNT),
              TEST_QUALITY_SCORE
            )
            .accounts({
              admin: admin,
              user: researcher1.publicKey,
              contributor: researcher1.publicKey,
              dataset: datasetPda,
              registry: datasetRegistry,
              reputation: repPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([researcher1])
            .rpc();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error.message).to.include("FileTooLarge");
        }
      });

      it("Should fail with invalid quality score (>100)", async () => {
        const contentHash = generateContentHash("invalid_quality_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/invalid/view");
        const fileNameBuffer = Buffer.from("invalid_quality.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher2.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher2.publicKey.toBuffer()],
          program.programId
        );

        try {
          await program.methods
            .createDataset(
              contentHash,
              TEST_AI_METADATA,
              fileNameBuffer,
              new anchor.BN(TEST_FILE_SIZE),
              dataUri,
              new anchor.BN(TEST_COLUMN_COUNT),
              new anchor.BN(TEST_ROW_COUNT),
              150
            )
            .accounts({
              admin: admin,
              user: researcher2.publicKey,
              contributor: researcher2.publicKey,
              dataset: datasetPda,
              registry: datasetRegistry,
              reputation: repPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([researcher2])
            .rpc();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error.message).to.include("InvalidQualityScore");
        }
      });

      it("Should fail with zero file size", async () => {
        const contentHash = generateContentHash("zero_size_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/zero/view");
        const fileNameBuffer = Buffer.from("zero.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher3.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher3.publicKey.toBuffer()],
          program.programId
        );

        try {
          await program.methods
            .createDataset(
              contentHash,
              TEST_AI_METADATA,
              fileNameBuffer,
              new anchor.BN(0),
              dataUri,
              new anchor.BN(TEST_COLUMN_COUNT),
              new anchor.BN(TEST_ROW_COUNT),
              TEST_QUALITY_SCORE
            )
            .accounts({
              admin: admin,
              user: researcher3.publicKey,
              contributor: researcher3.publicKey,
              dataset: datasetPda,
              registry: datasetRegistry,
              reputation: repPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([researcher3])
            .rpc();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error.message).to.include("InvalidFileSize");
        }
      });

      it("Should fail to create duplicate dataset with same content hash", async () => {
        const duplicateContentHash = generateContentHash("test_dataset_content_1");
        const dataUri = createDataUri("https://drive.google.com/file/d/duplicate/view");
        const fileNameBuffer = Buffer.from("duplicate.csv", 'utf-8');

        // FIXED: Include content hash consistently  
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher2.publicKey.toBuffer(), Buffer.from(duplicateContentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher2.publicKey.toBuffer()],
          program.programId
        );

        try {
          await program.methods
            .createDataset(
              duplicateContentHash,
              TEST_AI_METADATA,
              fileNameBuffer,
              new anchor.BN(TEST_FILE_SIZE),
              dataUri,
              new anchor.BN(TEST_COLUMN_COUNT),
              new anchor.BN(TEST_ROW_COUNT),
              TEST_QUALITY_SCORE
            )
            .accounts({
              admin: admin,
              user: researcher2.publicKey,
              contributor: researcher2.publicKey,
              dataset: datasetPda,
              registry: datasetRegistry,
              reputation: repPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([researcher2])
            .rpc();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error.message).to.include("already in use");
        }
      });

      it("Should fail with excessive column count (>100)", async () => {
        const contentHash = generateContentHash("too_many_columns");
        const dataUri = createDataUri("https://drive.google.com/file/d/columns/view");
        const fileNameBuffer = Buffer.from("many_columns.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher1.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher1.publicKey.toBuffer()],
          program.programId
        );

        try {
          await program.methods
            .createDataset(
              contentHash,
              TEST_AI_METADATA,
              fileNameBuffer,
              new anchor.BN(TEST_FILE_SIZE),
              dataUri,
              new anchor.BN(150),
              new anchor.BN(TEST_ROW_COUNT),
              TEST_QUALITY_SCORE
            )
            .accounts({
              admin: admin,
              user: researcher1.publicKey,
              contributor: researcher1.publicKey,
              dataset: datasetPda,
              registry: datasetRegistry,
              reputation: repPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([researcher1])
            .rpc();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error.message).to.include("TooManyColumns");
        }
      });
    });
  });

  describe("Reputation System", () => {
    describe("Upload Reputation Updates", () => {
      it("Should update reputation after successful dataset upload", async () => {
        const contentHash = generateContentHash("reputation_test_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/reputation/view");
        const fileNameBuffer = Buffer.from("reputation_test.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher1.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher1.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createDataset(
            contentHash,
            TEST_AI_METADATA,
            fileNameBuffer,
            new anchor.BN(TEST_FILE_SIZE),
            dataUri,
            new anchor.BN(TEST_COLUMN_COUNT),
            new anchor.BN(TEST_ROW_COUNT),
            90
          )
          .accounts({
            admin: admin,
            user: researcher1.publicKey,
            contributor: researcher1.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher1])
          .rpc();

        await program.methods
          .updateReputationUpload(90)
          .accounts({
            admin: admin,
            contributor: researcher1.publicKey,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher1])
          .rpc();

        const reputationAccount = await program.account.reputation.fetch(repPda);
        expect(reputationAccount.reputationScore.toNumber()).to.be.greaterThan(0);
        expect(reputationAccount.totalUploads.toNumber()).to.be.greaterThan(0);
      });

      it("Should give higher reputation for better quality scores", async () => {
        const [repPda1] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher2.publicKey.toBuffer()],
          program.programId
        );

        const [repPda2] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher3.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .updateReputationUpload(95)
          .accounts({
            admin: admin,
            contributor: researcher2.publicKey,
            reputation: repPda1,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher2])
          .rpc();

        await program.methods
          .updateReputationUpload(60)
          .accounts({
            admin: admin,
            contributor: researcher3.publicKey,
            reputation: repPda2,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher3])
          .rpc();

        const highQualityRep = await program.account.reputation.fetch(repPda1);
        const lowQualityRep = await program.account.reputation.fetch(repPda2);

        expect(highQualityRep.reputationScore.toNumber()).to.be.greaterThan(lowQualityRep.reputationScore.toNumber());
      });
    });

    describe("Download Reputation Updates", () => {
      it("Should update reputation when dataset is downloaded", async () => {
        const contentHash = generateContentHash("download_test_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/download/view");
        const fileNameBuffer = Buffer.from("download_test.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher1.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher1.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createDataset(
            contentHash,
            TEST_AI_METADATA,
            fileNameBuffer,
            new anchor.BN(TEST_FILE_SIZE),
            dataUri,
            new anchor.BN(TEST_COLUMN_COUNT),
            new anchor.BN(TEST_ROW_COUNT),
            TEST_QUALITY_SCORE
          )
          .accounts({
            admin: admin,
            user: researcher1.publicKey,
            contributor: researcher1.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher1])
          .rpc();

        const initialRep = await program.account.reputation.fetch(repPda);
        const initialScore = initialRep.reputationScore.toNumber();

        await program.methods
          .updateReputationDownload()
          .accounts({
            admin: admin,
            contributor: researcher1.publicKey,
            reputation: repPda,
            dataset: datasetPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher1])
          .rpc();

        const updatedRep = await program.account.reputation.fetch(repPda);
        expect(updatedRep.reputationScore.toNumber()).to.be.greaterThan(initialScore);
        expect(updatedRep.totalDownloads.toNumber()).to.equal(initialRep.totalDownloads.toNumber() + 1);
      });

      it("Should handle multiple downloads correctly", async () => {
        const contentHash = generateContentHash("multiple_download_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/multiple/view");
        const fileNameBuffer = Buffer.from("multiple.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher2.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher2.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createDataset(
            contentHash,
            TEST_AI_METADATA,
            fileNameBuffer,
            new anchor.BN(TEST_FILE_SIZE),
            dataUri,
            new anchor.BN(TEST_COLUMN_COUNT),
            new anchor.BN(TEST_ROW_COUNT),
            TEST_QUALITY_SCORE
          )
          .accounts({
            admin: admin,
            user: researcher2.publicKey,
            contributor: researcher2.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher2])
          .rpc();

        for (let i = 0; i < 3; i++) {
          await program.methods
            .updateReputationDownload()
            .accounts({
              admin: admin,
              contributor: researcher2.publicKey,
              reputation: repPda,
              dataset: datasetPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([researcher2])
            .rpc();
        }

        const finalRep = await program.account.reputation.fetch(repPda);
        expect(finalRep.totalDownloads.toNumber()).to.equal(3);
      });
    });

    describe("Citation Reputation Updates", () => {
      it("Should update reputation when dataset is cited", async () => {
        const contentHash = generateContentHash("citation_test_dataset");
        const dataUri = createDataUri("https://drive.google.com/file/d/citation/view");
        const fileNameBuffer = Buffer.from("citation_test.csv", 'utf-8');

        // FIXED: Include content hash consistently
        const [datasetPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("dataset"), researcher3.publicKey.toBuffer(), Buffer.from(contentHash)],
          program.programId
        );

        const [repPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), researcher3.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createDataset(
            contentHash,
            TEST_AI_METADATA,
            fileNameBuffer,
            new anchor.BN(TEST_FILE_SIZE),
            dataUri,
            new anchor.BN(TEST_COLUMN_COUNT),
            new anchor.BN(TEST_ROW_COUNT),
            TEST_QUALITY_SCORE
          )
          .accounts({
            admin: admin,
            user: researcher3.publicKey,
            contributor: researcher3.publicKey,
            dataset: datasetPda,
            registry: datasetRegistry,
            reputation: repPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([researcher3])
          .rpc();

        const initialRep = await program.account.reputation.fetch(repPda);
        const initialScore = initialRep.reputationScore.toNumber();

        await program.methods
          .updateReputationCitation()
          .accounts({
            admin: admin,
            contributor: researcher3.publicKey,
            reputation: repPda,
            dataset: datasetPda,
            systemProgram: SystemProgram.programId,
          });
      });
    });
  });
});

