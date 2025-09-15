use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Attribution {
    pub dataset_id: Pubkey,
    pub downloader: Pubkey,
    pub contributor: Pubkey,
    pub download_time: i64,
    pub bump: u8
}