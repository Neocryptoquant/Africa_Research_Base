import BN from 'bn.js';

export interface CreateDatasetArgs {
  contentHash: number[];
  aiMetadata: number[];
  fileName: number[];
  fileSize: BN;
  dataUri: number[];
  columnCount: BN;
  rowCount: BN;
//   import BN from 'bn.js';
}
  export interface CreateDatasetArgs {
    contentHash: number[];
    aiMetadata: number[];
    fileName: number[];
    fileSize: BN;
    dataUri: number[];
    columnCount: BN;
    rowCount: BN;
    qualityScore: number;
  }

  export interface ReputationData {
    contributor: string;
    totalUploads: BN;
    datasetCount: BN;
    downloadTime: BN;
    totalQualityScore: BN;
    totalDownloads: BN;
    totalCitations: BN;
    reputationScore: BN;
    bump: number;
  }

  export interface DatasetData {
    id: string;
    contributor: string;
    contentHash: number[];
    aiMetadata: number[];
    fileName: number[];
    fileSize: BN;
    dataUri: number[];
    columnCount: BN;
    rowCount: BN;
    qualityScore: number;
    uploadTimestamp: BN;
    lastUpdated: BN | null;
    downloadCount: number;
    isActive: boolean;
    bump: number;
  }