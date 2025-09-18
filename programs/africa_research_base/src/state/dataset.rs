use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Dataset {
    pub id: Pubkey,
    pub contributor: Pubkey,
    pub content_hash: [u8; 32],

    #[max_len(1500)]
    pub ai_metadata: Vec<u8>,

    #[max_len(100)]
    pub file_name: Vec<u8>,
    pub dataset_index: u32,
    pub file_size: u64,
    pub data_uri: [u8; 256],
    pub column_count: u64,
    pub row_count: u64,
    pub quality_score: u8,
    pub upload_timestamp: i64,
    pub last_updated: Option<i64>,
    pub download_count: u32,
    pub is_active: bool,
    pub bump: u8
}