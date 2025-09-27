# Africa_Research_Base

Great things, they say, begin with an idea. This is a great idea. 

> **Turning African research data into a shared continental resource**

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-green)](https://solana.com/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-blue)](https://groq.com/)
[![Made in Africa](https://img.shields.io/badge/Made%20in-Africa-red)](https://github.com)

**The Problem:** Brilliant research data from African universities disappears when projects end. Students graduate, datasets vanish, and future researchers reinvent the wheel.

**Our Solution:** AI-powered data repository with blockchain attribution. Upload once, get discovered forever, build reputation through meaningful contributions.

---

## ✨ What We're Building

**For Researchers:**
- 📤 **Upload datasets** with drag-and-drop simplicity
- 🤖 **AI analysis** extracts metadata in 60 seconds
- 📊 **Analytics dashboards** for dataset usage and reputation
- 🔍 **Discover similar data** from across African institutions
- 📊 **Get attribution** for every download and citation (on-chain)

**For the Ecosystem:**
- 🏛️ **Cross-institutional** collaboration without silos
- 🔗 **Transparent attribution** via Solana blockchain
- 📈 **Impact tracking** for research contributions
- 🧩 **Modular smart contract logic** for extensibility
- 🛡️ **Custom error codes** for robust validation
- 🌍 **Continental knowledge base** that grows with every upload

---

## 🚀 Live Demo

**Try it out:** [africaresearchbase.netlify.com](https://africaresearchbase.netlify.com) 

**Demo Flow:**
1. Upload your research dataset (CSV/Excel)
2. Watch AI analyze columns, quality, and research field
3. See your data become discoverable by peers
4. Track downloads and build on-chain reputation

---

## 🛠️ Tech Stack

- **Frontend:** Next.js + TypeScript + TailwindCSS
- **Blockchain:** Solana (Anchor smart contracts, modular instructions, on-chain reputation)
- **Storage:** Google Drive API (cost-optimized hybrid)
- **AI:** Groq + LangChain (real-time analysis, metadata extraction)
- **Database:** Supabase (search + indexing)
- **Analytics:** Custom dashboards for dataset usage and reputation

---

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- Yarn or npm
- Solana CLI
- Google Cloud Console access

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/africa-data-bank.git
cd africa-data-bank

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
```

### Environment Setup

Create `.env.local` with:

```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_wallet_private_key

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### API Keys Setup

1. **Groq API:**
   ```bash
   # Sign up at console.groq.com
   # Create API key in dashboard
   ```

2. **Supabase:**
   ```bash
   # Create project at supabase.com
   # Copy URL and anon key from settings
   ```

### Run Development Server

```bash
# Start the development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---


## 📁 Project Structure

```
africa_research_base/
├── app/
│   ├── components/          # React components (FileUpload, DatasetAnalytics, PaymentModal, etc.)
│   ├── hooks/               # Custom React hooks (useDatasets, etc.)
│   ├── api/                 # API routes (Groq, Solana, file parsing)
├── programs/
│   └── africa_research_base/
│       ├── src/
│       │   ├── instructions/ # Modular smart contract logic (create_dataset.rs, update_reputation.rs, etc.)
│       │   ├── state/        # State structs (dataset.rs, reputation.rs, registry.rs)
│       │   └── error.rs      # Custom error codes
│       └── tests/            # Anchor TypeScript tests
├── migrations/               # Deployment scripts
├── docs/                     # Documentation & diagrams
└── idl/                      # Anchor IDL files
```

---

## 🧪 Testing

```bash
# Run unit tests
yarn test

# Run integration tests
yarn test:integration

# Test smart contracts
cd programs && anchor test

```

---

## 🚢 Deployment


### Frontend (Netlify)
```bash
# Build for production
yarn build

# Deploy to Netlify
# Push your repo to GitHub, then connect it to Netlify at https://app.netlify.com/ and set build command to 'yarn build' and publish directory to 'app/app' or your frontend folder.
```
### Search Datasets
```typescript
GET /api/datasets/search?q=climate&field=environment

Response: {
   datasets: Dataset[],
   total: number,
   page: number
}
```

**Note:** All uploads are analyzed in real-time by AI, attributed on-chain, and indexed for search. See [Full API docs →](./docs/api.md)

---

## 🤝 Contributing

We're building this for the African research community! Here's how you can help:

1. **🐛 Report bugs** - Found something broken? [Open an issue](https://github.com/neocryptoquant/africa_research_base/issues)
2. **💡 Suggest features** - Have ideas? We'd love to hear them
3. **🔧 Submit PRs** - Check our [contributing guide](./CONTRIBUTING.md)
4. **📊 Share datasets** - Help us test with real research data
5. **🌍 Spread the word** - Tell your researcher friends!

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
yarn test

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📊 Roadmap

- [x] **MVP:** Basic upload + AI analysis + blockchain storage
- [ ] **Phase 1:** Advanced search + recommendation engine
- [ ] **Phase 2:** Multi-format support + data visualization
- [ ] **Phase 3:** University partnerships + institutional features
- [ ] **Phase 4:** Grant funding integration + impact tracking

[Detailed roadmap →](./docs/roadmap.md)

---

## 🏆 Hackathon

Built during the **Solana x AI Hackathon 2025**

**Team:**
- Team Lead: Mbanwusi Francisca - Organization + Lead Researcher
- Team Technical Lead: Abimbola A.E. - Full-stack + Solana development
- Design Lead: Chiemere V. - UI/UX for research workflows

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.


**Made with ❤️ for African researchers, by African developers**

*"African research data should work as hard as African researchers do"*
