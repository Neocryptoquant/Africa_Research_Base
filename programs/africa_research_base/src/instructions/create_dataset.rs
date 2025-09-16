#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

use crate::{Dataset, InitializeBumps, Registry, Reputation};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct CreateDataset <'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"registry", admin.key().as_ref()],
        bump = registry.bump
    )]
    pub registry: Account <'info, Registry>,

    #[account(
        seeds = [b"dataset", admin.key().as_ref()],
        bump
    )]
    pub dataset: Account <'info, Dataset>,

    #[account(
        seeds = [b"reputation", contributor.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account <'info, Reputation>,

    pub system_program: Program<'info, System>,
}

impl <'info> CreateDataset <'info> {
    pub fn create_dataset (
        &mut self,
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
        bumps: &CreateDatasetBumps
    ) -> Result<()> {
        // require!(content_hash.len() <= 64, ErrorCode::HashTooLong);
        require!(file_name.len() <= 100, ErrorCode::FileNameTooLong);
        require!(quality_score <= 100, ErrorCode::InvalidQualityScore);
        require!(file_size <= 104_857_600, ErrorCode::FileTooLarge);


        let dataset = &mut self.dataset;
        let registry = &mut self.registry;
        let reputation = &mut self.reputation;
        let clock = Clock::get()?;

        dataset.id = dataset.key();
        dataset.contributor = self.contributor.key();
        dataset.content_hash = content_hash;
        dataset.ai_metadata = ai_metadata;
        dataset.file_name = file_name;
        dataset.file_size = file_size;
        dataset.column_count = column_count;
        dataset.row_count = row_count;
        dataset.quality_score = quality_score;
        dataset.upload_timestamp = clock.unix_timestamp;
        dataset.last_updated = None;
        dataset.download_count = 0;
        dataset.is_active = true;
        dataset.bump = bumps.dataset;

        registry.total_datasets = registry.total_datasets.checked_add(1).unwrap();

        reputation.contributor = self.contributor.key();
        reputation.total_uploads = reputation.total_uploads.checked_add(1).unwrap();
        reputation.total_quality_score = reputation.total_quality_score.checked_add(quality_score as u64).unwrap();
        // reputation.

        Ok(())
    }
}


  