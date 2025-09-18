#![allow(unexpected_cfgs)]
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod events;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("EAo3vy4cYj9ezXbkZRwWkhUnNCjiBcF2qp8vwXwNsPPD");

#[program]
pub mod africa_research_base {
    use super::*;

    pub fn initialize_registry (
        ctx: Context<Initialize>,
    ) -> Result<()> {
        ctx.accounts.initialize_registry(&ctx.bumps)
    }


    pub fn create_dataset(
        ctx: Context<CreateDataset>,
        content_hash: [u8; 32],
        ai_metadata: Vec<u8>,
        file_name: Vec<u8>,
        file_size: u64,
        data_uri: [u8; 256],
        column_count: u64,
        row_count: u64,
        quality_score: u8,
        // upload_timestamp: i64,
        // last_updated: Option<i64>,
        // download_count: u32,
        // is_active: bool,
    ) -> Result<()> {
        ctx.accounts.create_dataset(content_hash, ai_metadata, file_name, file_size, data_uri, column_count, row_count, quality_score, &ctx.bumps)?;

        Ok(())
    }
    pub fn initialize_reputation(
        ctx: Context<InitializeReputation>
    ) -> Result<()> {
        ctx.accounts.initialize_reputation(&ctx.bumps)
    }

    pub fn update_reputation_upload(
        ctx: Context<UpdateReputationOnUpload>,
        quality_score: u8
    ) -> Result<()> {
        ctx.accounts.update_reputation_upload(quality_score)
    }

    pub fn update_reputation_download(
        ctx: Context<UpdateReputationOnDownload>
    ) -> Result<()> {
        ctx.accounts.update_reputation_download()
    }

    pub fn update_reputation_citation(
        ctx: Context<UpdateReputationOnCitation>
    ) -> Result<()> {
        ctx.accounts.update_reputation_citation()
    }
}
