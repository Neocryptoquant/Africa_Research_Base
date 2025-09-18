use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Content hash too long")]
    HashTooLong,
    #[msg("File name too long")]
    FileNameTooLong,
    #[msg("Invalid quality score (must be 0-100)")]
    InvalidQualityScore,
    #[msg("Too many research fields (max 10)")]
    TooManyFields,
    #[msg("File too large (max 100MB)")]
    FileTooLarge,
    #[msg("Invalid file size (must be greater than 0)")]
    InvalidFileSize,
    #[msg("Too many columns (max 100)")]
    TooManyColumns,
    #[msg("Dataset is inactive")]
    DatasetInactive,
    #[msg("Unauthorized to update this dataset")]
    UnauthorizedUpdate,
    #[msg("Numerical overflow occurred")]
    NumericalOverflow,
    #[msg("Invalid reputation update")]
    InvalidReputationUpdate,
    #[msg("Unauthorized reputation update")]
    UnauthorizedReputationUpdate,
    #[msg("Dataset with this content hash already exists for this contributor")]
    DuplicateDataset,
    #[msg("Invalid contributor status")]
    InvalidContributorStatus,
}
