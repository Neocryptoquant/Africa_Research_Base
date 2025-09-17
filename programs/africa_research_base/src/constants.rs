use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";
// Constants for reputation scoring
pub const UPLOAD_WEIGHT: u32 = 10;
pub const DOWNLOAD_WEIGHT: u32 = 2;
pub const CITATION_WEIGHT: u32 = 15;
pub const QUALITY_MULTIPLIER: u32 = 1;