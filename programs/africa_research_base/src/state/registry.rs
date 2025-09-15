use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Registry {
    pub admin: Pubkey,
    pub total_datasets: u64,
    pub total_downloads: u64,
    pub bump: u8
}