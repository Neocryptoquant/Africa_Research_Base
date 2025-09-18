#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

use crate::{Registry, Reputation};

#[derive(Accounts)]
pub struct Initialize <'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Registry::INIT_SPACE,
        seeds = [b"registry", admin.key().as_ref()],
        bump
    )]
    pub registry: Account <'info, Registry>,

    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct InitializeReputation <'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub contributor: Signer<'info>,
    
    #[account(
        init,
        payer = contributor,
        space = 8 + Reputation::INIT_SPACE,
        seeds = [b"reputation", contributor.key().as_ref()],
        bump
    )]
    pub reputation: Account <'info, Reputation>,

    pub system_program: Program<'info, System>
}


impl <'info> Initialize <'info> {
    pub fn initialize_registry (
        &mut self,
        bumps: &InitializeBumps
    ) -> Result<()> {
        self.registry.set_inner(Registry {
            admin: self.admin.key(),
            total_datasets: 0,
            total_downloads: 0,
            bump: bumps.registry
        });

        Ok(())

    }

    // pub fn initialize_dataset (
    //     &mut self,
    //     bumps: &InitializeBumps
    // ) -> Result<()> {
    //     self.dataset.set_inner(Dataset {
    //         id: self.admin.key(),
    //         contributor: self.contributor.key(),
    //         content_hash: [0u8; 32],
    //         ai_metadata: Vec::new(),
    //         file_name: Vec::new(),
    //         file_size: 0,
    //         column_count: 0,
    //         row_count: 0,
    //         quality_score: 0,
    //         upload_timestamp: 0,
    //         last_updated: None,
    //         download_count: 0,
    //         is_active: false,
    //         bump: bumps.dataset
    //     });

    //     Ok(())

    // }

    
    // pub fn initialize_reputation (
    //     &mut self,
    //     bumps: &InitializeBumps
    // ) -> Result<()> {
    //     self.reputation.set_inner(Reputation { 
    //         contributor: self.contributor.key(), 
    //         total_uploads: 0, 
    //         download_time: 0, 
    //         total_quality_score: 0, 
    //         total_downloads: 0, 
    //         total_citations: 0, 
    //         reputation_score: 0, 
    //         bump: bumps.reputation 
    //     });

    //     Ok(())
    // }

    // pub fn initialize_citation (
    //     &mut self,
    //     bumps: &InitializeBumps
    // ) -> Result<()> {
    //     self.citation.set_inner(Citation { 
    //         dataset_id: self.dataset.key(), 
    //         citer: self.user.key(), 
    //         contributor: self.contributor.key(), 
    //         published_information: Vec::new(), 
    //         citing_time: 0, 
    //         bump: bumps.citation
    //     });

    //     Ok(())
    // }

    // pub fn initialize_attribution(
    //     &mut self,
    //     bumps: &InitializeBumps
    // ) -> Result<()> {
    //     self.attribution.set_inner(Attribution { 
    //         dataset_id: self.dataset.key(), 
    //         downloader: self.user.key(), 
    //         contributor: self.contributor.key(), 
    //         download_time: 0, 
    //         bump: bumps.attribution 
    //     });

        // Ok(())
    
}

impl <'info> InitializeReputation <'info> {
    pub fn initialize_reputation (
        &mut self,
        bumps: &InitializeReputationBumps
    ) -> Result<()> {
        self.reputation.set_inner(Reputation { 
            contributor: self.contributor.key(), 
            total_uploads: 0, 
            dataset_count: 0, 
            download_time: 0, 
            total_quality_score: 0, 
            total_downloads: 0, 
            total_citations: 0, 
            reputation_score: 0, 
            bump: bumps.reputation 
        });

        Ok(())
    }
}