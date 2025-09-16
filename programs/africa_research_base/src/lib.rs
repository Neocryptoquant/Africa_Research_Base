pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("EAo3vy4cYj9ezXbkZRwWkhUnNCjiBcF2qp8vwXwNsPPD");

#[program]
pub mod africa_research_base {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn create_dataset(
        ctx: Context<CreateDataset>,
        content_hash: [u8; 32],
        ai_metadata: Vec<u8>,
        file_name: Vec<u8>,
        file_size: u64,
        column_count: u64,
        row_count: u64,
        quality_score: u8,
        upload_timestamp: i64,
        last_updated: Option<i64>,
        download_count: u32,
        is_active: bool,
    ) -> Result<()> {
        ctx.accounts.create_dataset(content_hash, ai_metadata, file_name, file_size, column_count, row_count, quality_score, upload_timestamp, last_updated, download_count, is_active, &ctx.bumps)?;

        Ok(())
    }
}
