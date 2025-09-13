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
}
