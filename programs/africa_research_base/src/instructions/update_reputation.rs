#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

use crate::{Dataset, Reputation};
use crate::error::ErrorCode;
use crate::constants::*;


#[derive(Accounts)]
pub struct UpdateReputationOnUpload<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"reputation", contributor.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputationOnDownload<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"reputation", contributor.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,

    #[account(
        mut,
        seeds = [b"dataset", contributor.key().as_ref(), &dataset.dataset_index.to_le_bytes()],
        bump,
        constraint = dataset.contributor == contributor.key()
    )]
    pub dataset: Account<'info, Dataset>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputationOnCitation<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"reputation", contributor.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,

    #[account(
        mut,
        seeds = [b"dataset", contributor.key().as_ref(), &dataset.dataset_index.to_le_bytes()],
        bump,
        constraint = dataset.contributor == contributor.key()
    )]
    pub dataset: Account<'info, Dataset>,

    pub system_program: Program<'info, System>,
}

// Standalone helper for reputation score calculation
fn calculate_reputation_score(reputation: &mut Reputation) -> Result<()> {
    let upload_score = (reputation.total_uploads as u32)
        .checked_mul(UPLOAD_WEIGHT)
        .ok_or(ErrorCode::NumericalOverflow)?;

    let quality_score = if reputation.total_uploads > 0 {
        ((reputation.total_quality_score as u32)
            .checked_mul(QUALITY_MULTIPLIER)
            .ok_or(ErrorCode::NumericalOverflow)?)
            .checked_div(reputation.total_uploads as u32)
            .unwrap_or(0)
    } else {
        0
    };

    let download_score = (reputation.total_downloads as u32)
        .checked_mul(DOWNLOAD_WEIGHT)
        .ok_or(ErrorCode::NumericalOverflow)?;

    let citation_score = reputation.total_citations
        .checked_mul(CITATION_WEIGHT)
        .ok_or(ErrorCode::NumericalOverflow)?;

    reputation.reputation_score = upload_score
        .checked_add(quality_score)
        .ok_or(ErrorCode::NumericalOverflow)?
        .checked_add(download_score)
        .ok_or(ErrorCode::NumericalOverflow)?
        .checked_add(citation_score)
        .ok_or(ErrorCode::NumericalOverflow)?;
    Ok(())
}

impl<'info> UpdateReputationOnUpload<'info> {
    
    pub fn update_reputation_upload(
        &mut self,
        quality_score: u8,
    ) -> Result<()> {
        let reputation = &mut self.reputation;
        reputation.total_uploads = reputation.total_uploads.checked_add(1).ok_or(ErrorCode::NumericalOverflow)?;
        reputation.total_quality_score = reputation.total_quality_score.checked_add(quality_score as u64).ok_or(ErrorCode::NumericalOverflow)?;
        calculate_reputation_score(reputation)?;
        Ok(())
    }
}

impl<'info> UpdateReputationOnDownload<'info> {
    pub fn update_reputation_download(&mut self) -> Result<()> {
        let reputation = &mut self.reputation;
        reputation.total_downloads = reputation.total_downloads.checked_add(1).ok_or(ErrorCode::NumericalOverflow)?;
        let clock = Clock::get()?;
        reputation.download_time = clock.unix_timestamp;
        calculate_reputation_score(reputation)?;
        Ok(())
    }
}

impl<'info> UpdateReputationOnCitation<'info> {
    pub fn update_reputation_citation(&mut self) -> Result<()> {
        let reputation = &mut self.reputation;
        reputation.total_citations = reputation.total_citations.checked_add(1).ok_or(ErrorCode::NumericalOverflow)?;
        calculate_reputation_score(reputation)?;
        Ok(())
    }
}