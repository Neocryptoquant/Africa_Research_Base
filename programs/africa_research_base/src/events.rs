use anchor_lang::prelude::*;

#[event]
pub struct DatasetCreated {
    pub id: Pubkey,
    pub contributor: Pubkey,
    pub content_hash: [u8; 32],
    pub quality_score: u8,
    pub upload_timestamp: i64,
}

#[event]
pub struct ReputationUpdated {
    pub contributor: Pubkey,
    pub action: String,  // e.g., "upload", "download", "citation"
    pub new_dataset_count: u32,
    pub new_reputation_score: u32,  // Can compute here if you add logic (e.g., quality * uploads)
}

#[event]
pub struct CitationRecorded {  // Bonus: For citation tracking
    pub dataset_id: Pubkey,
    pub citer: Pubkey,
    pub contributor: Pubkey,
    pub citing_time: i64,
}