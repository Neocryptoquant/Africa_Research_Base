use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Citation {
    pub dataset_id: Pubkey,
    pub citer: Pubkey,
    pub contributor: Pubkey,
    
    #[max_len(1000)]
    pub published_information: Vec<u8>,
    pub citing_time: i64,
    pub bump: u8
}