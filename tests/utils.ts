import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';

export const PROGRAM_SEED = 'africa_research_base';
export const REGISTRY_SEED = 'registry';
export const DATASET_SEED = 'dataset';
export const REPUTATION_SEED = 'reputation';

export const findProgramAddress = async (
  seeds: Array<Buffer | Uint8Array>,
  programId: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(seeds, programId);
};

export const deriveRegistryPDA = async (
  admin: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await findProgramAddress(
    [Buffer.from(REGISTRY_SEED), admin.toBuffer()],
    programId
  );
};

export const deriveDatasetPDA = async (
  contributor: anchor.web3.PublicKey,
  //contentHash: number[],
  programId: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await findProgramAddress(
    [
      Buffer.from(DATASET_SEED),
      contributor.toBuffer(),
      //Buffer.from(contentHash)
    ],
    programId
  );
};

export const deriveReputationPDA = async (
  contributor: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await findProgramAddress(
    [Buffer.from(REPUTATION_SEED), contributor.toBuffer()],
    programId
  );
};

export const createBN = (num: number): BN => {
  return new BN(num);
};