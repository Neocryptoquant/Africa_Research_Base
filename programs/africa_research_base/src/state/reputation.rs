use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Reputation {
    pub contributor: Pubkey,
    pub total_uploads: u32,
    pub dataset_count: u32, // Track number of datasets created by this contributor
    pub download_time: i64,
    pub total_quality_score: u64,
    pub total_downloads: u64,
    pub total_citations: u32,
    pub reputation_score: u32,
    pub bump: u8
}